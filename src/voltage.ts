import './style.css'
import * as sp from 'seisplotjs';
import {loadLatencyVoltage} from './jsonl_loader';
import type {LatencyVoltage} from './jsonl_loader';
import {
  doPlot,
  createColors,
  createKeyCheckboxes,
  initTimeChooser,
  createStationCheckboxes,
  createUpdatingClock,
  timesort
} from './statpage'
import {loadActiveStations} from './util';

import { Duration} from 'luxon';

import {createNavigation} from './navbar';

createNavigation();
const app = document.querySelector<HTMLDivElement>('#app')!

if (true) {
app.innerHTML = `
<h1>Voltage</h1>

<h3>South Carolina Seismic Network</h3>

<div id="scsnStations">
  <label class="sectionlabel" title="Stations within the South Carolina Seismic Network">Stations:</label>
</div>
<div id="times">
  <label class="sectionlabel">Time Range: </label>
  <sp-timerange duration="P7DT0M" prev-next="true"></sp-timerange>

  <label class="sectionlabel">Mouse: </label><span id="mousetime"></span>
</div>

<details id="messagesParent">
  <summary class="sectionlabel">Messages:</summary>
  <div id="messages">
  </div>
</details>

<h5>Voltage</h5>
<div class="plot"></div>
<div class="stations"></div>
<div class="datakeys"></div>

<h5>Generated with <a href="https://github.com/crotwell/seisplotjs">Seisplotjs version <span class="sp_version">3.1.5-SNAPSHOT</span></a>.</h5>

`;

sp.util.updateVersionText('.sp_version');
}

createUpdatingClock();

let curKey = "voltage";
const knownKeys = [
  "voltage"
]

let allStations: Array<string> = [];
let colorForStation: Map<string, string> = new Map();
let selectedStations: Array<string> = [];

const timeChooser = initTimeChooser(Duration.fromISO("P2DT120M"), (timerange => {
  dataPromise = loadLatencyVoltage(selectedStations, timerange);
}));
let dataPromise: Promise<Array<LatencyVoltage>>|null = null;


function dataFn(d: LatencyVoltage): null|number|string|Array<number> {
  if (curKey in d) {
    return d[curKey];
  } else {
    return null;
  }
}

const stationCallback = function(sta: string, checked: boolean) {
  return dataPromise?.then(allStats => {
    if (checked) {
      selectedStations.push(sta);
    } else {
      selectedStations = selectedStations.filter(s => s !== sta);
    }
    return allStats;
  }).then((allStats: Array<LatencyVoltage>) => {
    doPlotInner(allStats);
  });
}

function createKeyCheckbox(stat: LatencyVoltage) {
  const selector = 'div.datakeys';
  let statKeys: Array<string> = [];
  statKeys = statKeys.concat(knownKeys);
  for(const key in stat) {
    if (key === 'time' || key === 'station' || key === 'soc' ) {
      continue;
    }
    statKeys.push(key);
  }

  createKeyCheckboxes(selector,
                      statKeys,
                      curKey,
                      (key: string)=>{
                        curKey = key;
                        dataPromise?.then((allStats: Array<LatencyVoltage>) => {
                          doPlot("div.plot", allStats, dataFn, selectedStations, colorForStation);
                          return Promise.resolve(allStats);
                        });
                      });
  return stat;
}

loadActiveStations()
  .then(staList => staList.map(s => s.stationCode))
  .then(staCodes => {
    allStations = staCodes;
    selectedStations = allStations.slice();
    colorForStation = createColors(allStations);
    selectedStations = allStations.slice();
    createStationCheckboxes(allStations, stationCallback, colorForStation, true);


    let timerange = timeChooser.toInterval();
    dataPromise = loadLatencyVoltage(selectedStations, timerange)
      .then(allStats => {
        console.log(`got voltage, ${allStats.length}`)
        if (allStats.length > 0) {
          createKeyCheckbox(allStats[0]);
        }
        allStats.sort(timesort);
        doPlotInner(allStats);
        return allStats;
      }).then( (allStats) => {
        return allStats;
      }).catch( err => {
        console.log(`error in data: ${err}`);
        throw err;
      });
    return dataPromise;
});

function doPlotInner(dohList: Array<LatencyVoltage>) {
  const xRange = null;
  const yRange: [number, number] = [11, 15]
  doPlot("div.plot",
          dohList,
          doh => doh.volt,
          selectedStations,
          colorForStation,
          xRange, yRange);
}
