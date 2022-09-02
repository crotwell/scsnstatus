import * as seisplotjs from 'seisplotjs';
import { loadKilovaultStats, KilovaultSOC} from './jsonl_loader.js';
import {
  doPlot,
  createKeyCheckboxes,
  initTimeChooser,
  createStationCheckboxes,
  createUpdatingClock,
} from './statpage.js'
import { Duration } from 'luxon';


const app = document.querySelector<HTMLDivElement>('#app')!

app.innerHTML = `
  <h5 id="nowtime">Now!</h5>
  <div>
    <sp-timerange duration="P2DT0M"></sp-timerange>
    <button id="loadNow">Now</button>
  </div>
  <div class="plot"></div>
  <div class="stations"></div>
  <div class="datakeys"></div>
  <svg></svg>
  <a href="https://vitejs.dev/guide/features.html" target="_blank">Documentation</a>
`


let curKey = "soc";
const lineColors = new seisplotjs.seismographconfig.SeismographConfig().lineColors;
const allStations = ["JSC", 'CASEE', 'HODGE']

let selectedStations = allStations.slice();

function dataFn(d: KilovaultSOC): number {
  if (curKey === "soc") {
    const firstObj = d.soc[0];
    if (firstObj && 'percentCharge' in firstObj) {
      return firstObj.percentCharge;
    } else {
      return 0;
    }
  } else {
    return 0;
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
                          doPlot("div.plot", allStats, dataFn, selectedStations, lineColors);
                        });
                      });
}

function handleData(allStats: Array<KilovaultSOC>) {
  if (allStats.length > 0) {
    createKeyCheckbox(allStats[0]);
  }
  doPlot("div.plot",
          allStats,
          dataFn,
          selectedStations,
          lineColors);
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
    doPlot("div.plot", allStats, dataFn, selectedStations, lineColors);
  });
}

createStationCheckboxes(allStations, stationCallback, lineColors);
createUpdatingClock();

const timeChooser = initTimeChooser(Duration.fromISO("P2DT120M"), (timerange => {
  dataPromise = loadKilovaultStats(selectedStations, timerange).then(handleData);
}));

let timerange = timeChooser.toInterval();
let dataPromise = loadKilovaultStats(selectedStations, timerange).then(handleData);
