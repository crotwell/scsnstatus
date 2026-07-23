import './style.css';

import {nwsSkyCover, stationForecast} from './nws.ts';
import {  loadBatteryStats} from './jsonl_loader';
import type { BatterySOC} from './jsonl_loader';
import {
  doPlot,
  doText,
  createColors,
  createKeyCheckboxes,
  initTimeChooser,
  createStationCheckboxes,
  createUpdatingClock,
  timesort,
} from './statpage'
import {loadActiveStations} from './util';
import { Duration } from 'luxon';
import {createNavigation} from './navbar';

createNavigation();
const DO_TEXT_OUTPUT = false;

const app = document.querySelector<HTMLDivElement>('#app')!

app.innerHTML = `
  <h5 id="nowtime">Now!</h5>
  <div>
    <sp-timerange duration="P2DT0M"></sp-timerange>
    <button id="loadToday">Today</button>
    <button id="loadNow">Now</button>
  </div>
  <div class="plot"></div>
  <div class="stations"></div>
  <div class="datakeys"></div>
  <div class="nws">
    <h5>Current Sky Cover:</h5>
    <button id="loadNWS">Load Weather Forecast</button>
    <ul class="nws">
    </ul>
  </div>
  <div class="forecast">
    <h5>Station Forecast:</h5>
    <table class="forecast">
    </table>
  </div>
  <div><pre class="raw"></pre></div>
`;


let curKey = "percentCharge";
const batteryKeys = [
  "percentCharge", "current", "voltage", "temperature",
  "id", "cycles", "battery_level", "cell_voltages"
]

let allStations: Array<string> = [];
let colorForStation: Map<string, string> = new Map();
let selectedStations: Array<string> = [];

function batteryKey(kvKey: string): string {
  if (kvKey === "percentCharge") {
    return "battery_level"
  }
  return kvKey;
}

function dataFn(d: BatterySOC): null|number|string|Array<number> {
  if (d.soc.length > 0) {
    const firstObj = d.soc[0];
    if (firstObj && firstObj[curKey]!= null) {
      return firstObj[curKey];
    } else if (firstObj && firstObj[batteryKey(curKey)]!= null) {
      return firstObj[batteryKey(curKey)];
    } else {
      return null;
    }
  } else {
    return null;
  }
}

function textDataFn(d: BatterySOC): string {
  if (d.soc.length == 0) {
    return "missing";
  }
  const firstObj = d.soc[0];
  if (firstObj[curKey]!=null) {
      return `${firstObj.id} ${firstObj[curKey]}`;
  } else {
    return "blank";
  }
}


function createKeyCheckbox(stat: BatterySOC) {
  const selector = 'div.datakeys';
  let statKeys: Array<string> = [];
  statKeys = statKeys.concat(batteryKeys);
  for(const key in stat) {
    if (key === 'time' || key === 'station' || key === 'soc' ) {
      continue;
    }
    statKeys.push(key);
  }

  createKeyCheckboxes(selector,
                      statKeys,
                      curKey,
                      (key)=>{
                        curKey = key;
                        dataPromise?.then((allStats: Array<BatterySOC>) => {
                          doPlot("div.plot", allStats, dataFn, selectedStations, colorForStation);
                          return Promise.resolve(allStats);
                        });
                      });
  return stat;
}

function handleData(allStats: Array<BatterySOC>): Array<BatterySOC> {
  if (allStats.length > 0) {
    createKeyCheckbox(allStats[0]);
  }
  allStats.sort(timesort);
  let expandData: Array<BatterySOC> = []
  allStats.forEach(stat => {
    if (stat.soc.length > 1) {
      stat.soc.forEach(s => {
        const d = structuredClone(stat);
        d.soc = [ s ]; // clone but with only one soc
        d.time = stat.time
        expandData.push(d)
      })
    } else {
      expandData.push(stat);
    }
  });

  if (DO_TEXT_OUTPUT) {
    // output raw values as text, for debugging
    doText("pre.raw",
            expandData,
            textDataFn,
            selectedStations,
          //  lineColors
          );
  }
  doPlot("div.plot",
          expandData,
          dataFn,
          selectedStations,
          colorForStation);
  return allStats;
}

const stationCallback = function(sta: string, checked: boolean) {
  return dataPromise?.then(allStats => {
    if (checked) {
      selectedStations.push(sta);
    } else {
      selectedStations = selectedStations.filter(s => s !== sta);
    }
    return allStats;
  }).then((allStats: Array<BatterySOC>) => {
    doPlot("div.plot", allStats, dataFn, selectedStations, colorForStation);
    if (DO_TEXT_OUTPUT) {
      // output raw values as text, for debugging
      doText("pre.raw",
              allStats,
              textDataFn,
              selectedStations,
            //  lineColors
            );
    }
  });
}

createUpdatingClock();
let dataPromise: Promise<Array<BatterySOC>>|null = null;

const timeChooser = initTimeChooser(Duration.fromISO("P2DT120M"), (timerange => {
  dataPromise = loadBatteryStats(selectedStations, timerange).then(handleData);
}));

loadActiveStations()
  .then(staList => staList.map(s => s.stationCode))
  .then(staCodes => {
    allStations = staCodes;
    selectedStations = allStations.slice().filter(sta => sta != "C1SC" && sta != "BARN");
    colorForStation = createColors(allStations);
    createStationCheckboxes(allStations, stationCallback, colorForStation, true);


    let timerange = timeChooser.toInterval();
    dataPromise = loadBatteryStats(selectedStations, timerange)
      .then(handleData)
      .then( (allStats) => {
        return allStats;
      }).catch( err => {
        console.log(`error in data: ${err}`);
        throw err;
      });
    return dataPromise;
});

document.querySelector("#loadNWS")?.addEventListener("click", ()=> {
  console.log(`before sky cover`)
  return nwsSkyCover().then(() => stationForecast());
})
