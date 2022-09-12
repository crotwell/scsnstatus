import './style.css';
import * as seisplotjs from 'seisplotjs';
import {loadCellStats, CellSOH, mib_floats, mib_ints, mib_strings} from './jsonl_loader.js';
import {
  doPlot,
  createKeyCheckboxes,
  initTimeChooser,
  createStationCheckboxes,
  createUpdatingClock,
} from './statpage.js'
import { Duration} from 'luxon';
import {createNavigation} from './navbar';

createNavigation();

const app = document.querySelector<HTMLDivElement>('#app')!

app.innerHTML = `
  <h5 id="nowtime">Now!</h5>
  <div>
    <sp-timerange duration="P0DT120M"></sp-timerange>
    <button id="loadToday">Today</button>
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

function createDataFn(curKey: string): ((d:CellSOH)=> string)|((d:CellSOH)=> number) {
  if (mib_floats.find(s=> s===curKey) || mib_ints.find(s=> s===curKey)) {
    return (d: CellSOH) => d[curKey] as number;
  } else if (mib_strings.find(s=> s===curKey)) {
    return (d: CellSOH) => d[curKey] as string;
  } else {
    throw new Error(`curKey: ${curKey} is not string or number`);
  }
}

function handleData(allStats: Array<CellSOH>) {
  if (allStats.length > 0) {
    createKeyCheckbox(allStats[0]);
  }
  doPlot("div.plot", allStats, createDataFn(curKey), selectedStations, lineColors);
  return allStats;
}

const timeChooser = initTimeChooser(Duration.fromISO("PT120M"), (timerange => {
  dataPromise = loadCellStats(selectedStations, timerange).then(handleData);
}));

let timerange = timeChooser.toInterval();
let dataPromise = loadCellStats(allStations, timerange).then(handleData);

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
                          doPlot("div.plot", allStats, createDataFn(curKey), selectedStations, lineColors);
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
    doPlot("div.plot", allStats, createDataFn(curKey), selectedStations, lineColors);
  });
}

createStationCheckboxes(allStations, stationCallback, lineColors);

createUpdatingClock();
