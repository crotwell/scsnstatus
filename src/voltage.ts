import './style.css'
import * as sp from 'seisplotjs';
import {setupStationRadioButtons} from './heli/controls';
import {showMessage, clearMessages} from './heli/doplot';
import {loadLatencyVoltage} from './jsonl_loader';
import type {LatencyVoltage} from './jsonl_loader';
import {
  doPlot,
  createColors,
  initTimeChooser,
  createStationCheckboxes,
  createUpdatingClock,
  timesort,
} from './statpage'
import {loadActiveStations} from './util';
import {stationList} from './util';

import {Interval, Duration, DateTime} from 'luxon';

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



// state preserved for browser history
// also see near bottom where we check if page history has state obj and use that
let state = {
  netCodeList: ["CO", "N4"],
  stationList: stationList,
  bandCodeList: ["H", "L"],
  instCodeList: ["H", "N"],
  orientationCodeList: ["Z", "N", "E", "1", "2"],
  netCode: "CO",
  station: stationList[0],
  locCode: "00",
  bandCode: "H",
  instCode: "H",
  orientationCode: "Z",
  altOrientationCode: "",
  endTime: "now",
  duration: "P7D",
  dominmax: true,
  amp: "max",
  rmean: false,
  filter: {
    type: "allpass",
    lowcut: "1.0",
    highcut: "10.0",
  },
};

let curKey = "voltage";
const batteryKeys = [
  "voltage"
]

let allStations: Array<string> = [];
let colorForStation: Map<string, string> = new Map();
let selectedStations: Array<string> = [];

const timeChooser = initTimeChooser(Duration.fromISO("P2DT120M"), (timerange => {
  dataPromise = loadBatteryStats(selectedStations, timerange).then(handleData);
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
  }).then((allStats: Array<BatterySOC>) => {
    const xRange = null;
    const yRange: [number, number] = [11, 15]
    doPlot("div.plot",
            allStats,
            doh => doh.volt,
            selectedStations,
            colorForStation,
            xRange, yRange);
  });
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
      .then(dohList => {
        console.log(`got voltage, ${dohList.length}`)
        doPlotInner(state,dohList);
        return dohList;
      }).then( (allStats) => {
        return allStats;
      }).catch( err => {
        console.log(`error in data: ${err}`);
        throw err;
      });
    return dataPromise;
});

function doPlotInner(state, dohList) {
  let voltList = "";
  let n = 0
  for (let v of dohList) {
    voltList += `${v.time} ${v.volt}\n`;
    n+=1;
    if (n>10) {break;}
  }
  const xRange = null;
  const yRange: [number, number] = [11, 15]
  doPlot("div.plot",
          dohList,
          doh => doh.volt,
          selectedStations,
          colorForStation,
          xRange, yRange);
}
