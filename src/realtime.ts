import './style.css'
import * as sp from 'seisplotjs';

const luxon = sp.luxon;

import {stationList} from './util.js';
import {
  updatePageForConfig,
  setupEventHandlers,
  enableFiltering,
  loadAllEarthquakeQueryParams,
} from "./heli/controls.js";
import {
  createColors,
  createStationCheckboxes,
  createUpdatingClock
} from './statpage';
import {loadActiveStations} from './util';
import {createNavigation} from './navbar';


const EARTHSCOPE_SEEDLINK = "wss://rtserve.earthscope.org/seedlink";
const SEEDLINK = EARTHSCOPE_SEEDLINK;

createNavigation();
const app = document.querySelector<HTMLDivElement>('#app')!

if (true) {
app.innerHTML = `

<h5 id="nowtime">Now!</h5>
<div class="stations">
  <label class="sectionlabel" title="Stations within the South Carolina Seismic Network">Stations:</label>
</div>

<div>
  <span id="loccode"><label class="sectionlabel">Loc Code: </label></span>
  <span id="instruments"><label class="sectionlabel">Instrument: </label></span>
  <span id="orientations"><label class="sectionlabel">Orientation: </label></span>
</div>
<div>
  <button id="disconnect">Reconnect</button>
  <button id="pause">Pause</button>
  <span id="seedlinkurl"></span>
</div>

<div id="realtime">
</div>
<h5>Generated with <a href="https://github.com/crotwell/seisplotjs">Seisplotjs version <span class="sp_version">3.1.5-SNAPSHOT</span></a>.</h5>

`;
}

sp.util.updateVersionText('.sp_version');


createUpdatingClock();

let allStations = [];
let stationCheckboxes = [];
let colorForStation = null;
let currSta = null;


let stationCallback = function(sta) {
  console.log(sta);
  currSta = sta;
  displayStations();

}
loadActiveStations()
  .then(staList => staList.map(s => s.stationCode))
  .then(staCodes => {
    allStations = staCodes;
    colorForStation = createColors(allStations);
    stationCheckboxes = createStationCheckboxes(allStations, stationCallback, colorForStation, false);
  });


const duration = sp.luxon.Duration.fromISO("PT5M");
let seedlink = null;
let paused = false;
let stopped = true;
let realtimeDiv = document.querySelector("div#realtime");


const rtConfig = {
  duration: sp.luxon.Duration.fromISO("PT5M"),
};
const rtDisp = sp.animatedseismograph.createRealtimeDisplay(rtConfig);
realtimeDiv.appendChild(rtDisp.organizedDisplay);
rtDisp.organizedDisplay.draw();
rtDisp.animationScaler.animate();


function errorFn(error) {
  console.assert(false, error);
  if (seedlink) {
    seedlink.close();
    seedlink = null;
  }
}

function toggleConnection() {
  stopped = !stopped;
  if (stopped) {
    document.querySelector("button#disconnect").textContent = "Reconnect";
    if (seedlink) {
      seedlink.close();
    }
  } else {
    displayStations();
  }
}

function displayStations() {
  document.querySelector("#seedlinkurl").textContent = SEEDLINK;
  if (seedlink) {
    seedlink.close();
    seedlink=null;
  }

  rtDisp.organizedDisplay.seisData = [];
  document.querySelector("button#disconnect").textContent = "Disconnect";

  let requestConfig = [];

  stationCheckboxes.forEach(cb => {
    if (cb.checked) {
      requestConfig.push(`STATION CO_${cb.name}`);
      requestConfig.push("SELECT 00_H_?_?");
    }
  });

  let start = sp.luxon.DateTime.utc().minus(duration);
  let dataCmd = sp.seedlink4.createDataTimeCommand(start);
  let requestConfigWithData = requestConfig.concat([ dataCmd ])
  let endCommand = sp.seedlink4.END_COMMAND;
  if (!seedlink) {
    seedlink = new sp.seedlink4.SeedlinkConnection(
      SEEDLINK,
      requestConfigWithData,
      (packet) => {
        rtDisp.packetHandler(packet);
      },
      errorFn,
    );
    seedlink.endCommand = endCommand;
  }
  if (seedlink) {
    start = sp.luxon.DateTime.utc().minus(duration);
    dataCmd = sp.seedlink4.createDataTimeCommand(start);
    requestConfigWithData = requestConfig.concat([ dataCmd ])
    seedlink.requestConfig = requestConfigWithData;
    requestConfigWithData.forEach(cmd => console.log(cmd));
    seedlink
      .connect()
      .catch(function (error) {
        addToDebug(`Error: ${error.name} - ${error.message}`);
        console.assert(false, error);
      });
  }
}


let togglePause = function () {
  paused = !paused;
  if (paused) {
    document.querySelector("button#pause").textContent = "Play";
    rtDisp.animationScaler.pause();
  } else {
    document.querySelector("button#pause").textContent = "Pause";
    rtDisp.animationScaler.animate();
  }
};

document
  .querySelector("button#pause")
  .addEventListener("click", function (evt) {
    togglePause();
  });


document
  .querySelector("button#disconnect")
  .addEventListener("click", function (evt) {
    toggleConnection();
  });
