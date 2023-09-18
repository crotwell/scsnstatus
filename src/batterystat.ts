import './style.css';
import * as sp from 'seisplotjs';
import { loadKilovaultStats, KilovaultSOC} from './jsonl_loader.js';
import {
  doPlot,
  doText,
  createColors,
  createKeyCheckboxes,
  initTimeChooser,
  createStationCheckboxes,
  createUpdatingClock,
  timesort,
} from './statpage.js'
import { Duration } from 'luxon';
import {createNavigation} from './navbar';

createNavigation();

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
  <div><pre class="raw"></pre></div>
  <a href="https://vitejs.dev/guide/features.html" target="_blank">Documentation</a>
`;


let curKey = "soc";
const lineColors = new sp.seismographconfig.SeismographConfig().lineColors;
const allStations = ["JSC", 'CASEE', 'CSB', 'HODGE', 'PAULI']
let colorForStation = createColors(allStations);

let selectedStations = allStations.slice();


function dataFn(d: KilovaultSOC): number {
  if (curKey === "soc") {
    const firstObj = d.soc[0];
    if (firstObj && 'percentCharge' in firstObj && firstObj.percentCharge) {
      return firstObj.percentCharge;
    } else {
      return 0;
    }
  } else {
    return 0;
  }
}

function textDataFn(d: KilovaultSOC): string {
  if (curKey === "soc") {
    const firstObj = d.soc[0];
    if (firstObj && 'percentCharge' in firstObj) {
      return `${firstObj.id} ${firstObj.percentCharge}`;
    } else {
      return "";
    }
  } else {
    return "";
  }
}

function createKeyCheckbox(stat: KilovaultSOC) {
  const selector = 'div.datakeys';
  let statKeys = [];
  for(const key in stat) {
    if (key === 'time' || key === 'station' ) {
      continue;
    }
    statKeys.push(key);
  }
  createKeyCheckboxes(selector,
                      statKeys,
                      curKey,
                      (key)=>{
                        curKey = key;
                        dataPromise.then(allStats => {
                          doPlot("div.plot", allStats, dataFn, selectedStations, colorForStation);
                        });
                      });
}

function handleData(allStats: Array<KilovaultSOC>) {
  if (allStats.length > 0) {
    createKeyCheckbox(allStats[0]);
  }
  allStats.sort(timesort);
  let expandData: Array<KilovaultSOC> = []
  if (curKey === "soc") {
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
    })
  } else {
    expandData = allStats;
  }

  if (false) {
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
  dataPromise.then(allStats => {
    if (checked) {
      selectedStations.push(sta);
    } else {
      selectedStations = selectedStations.filter(s => s !== sta);
    }
    return allStats;
  }).then(allStats => {
    doPlot("div.plot", allStats, dataFn, selectedStations, colorForStation);
  });
}

createStationCheckboxes(allStations, stationCallback, colorForStation);
createUpdatingClock();

const timeChooser = initTimeChooser(Duration.fromISO("P2DT120M"), (timerange => {
  dataPromise = loadKilovaultStats(selectedStations, timerange).then(handleData);
}));

let timerange = timeChooser.toInterval();
let dataPromise = loadKilovaultStats(selectedStations, timerange).then(handleData);
