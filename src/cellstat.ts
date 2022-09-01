import * as seisplotjs from 'seisplotjs';
import {loadCellStats, loadKilovaultStats, CellSOH} from './jsonl_loader.js';
import {scatterplot} from './scatterplot.js';
import {
  doPlot,
  createKeyCheckboxes,
  initTimeChooser,
  createStationCheckboxes,
  createUpdatingClock,
} from './statpage.js'
import { DateTime, Duration} from 'luxon';

export function grab(stationList: Array<string>, timeRange: Interval) {
  return Promise.all([
    loadCellStats(stationList, timeRange),
    loadKilovaultStats(stationList, timeRange)
  ])
  .then(([cellStats, kvStats]) => {
    return cellStats;
  });
}



const app = document.querySelector<HTMLDivElement>('#app')!

app.innerHTML = `
  <h5 id="nowtime">Now!</h5>
  <div>
    <sp-timerange duration="P0DT120M"></sp-timerange>
    <button id="loadNow">Now</button>
  </div>
  <div class="plot"></div>
  <div class="stations"></div>
  <div class="datakeys"></div>
  <svg></svg>
  <a href="https://vitejs.dev/guide/features.html" target="_blank">Documentation</a>
`

let curKey = "byterate";
const lineColors = new seisplotjs.seismographconfig.SeismographConfig().lineColors;
const allStations = ["BIRD", "JSC", 'CASEE', 'HODGE']

let selectedStations = allStations.slice();

function dataFn(d: CellSOH): string | number {
  return d[curKey];
}

function handleData(allStats: Array<CellSOH>) {
  if (allStats.length > 0) {
    createKeyCheckbox(allStats[0]);
  }
  doPlot("div.plot", allStats, dataFn, selectedStations, lineColors);
  return allStats;
}

const timeChooser = initTimeChooser(Duration.fromISO("PT120M"), (timerange => {
  dataPromise = grab(selectedStations, timerange).then(handleData);
}));

let timerange = timeChooser.toInterval();
let dataPromise = grab(allStations, timerange).then(handleData);

function createKeyCheckbox(stat: CellSOH) {
  const selector = 'div.datakeys';
  let statKeys = [];
  for(const key in stat) {
    if (key === 'time' || key === 'station' || key === 'sysDescr') {
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
