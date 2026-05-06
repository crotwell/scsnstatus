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
import {loadActiveStations, loadNetworks} from './util';
import {createNavigation} from './navbar';


const EARTHSCOPE_SEEDLINK = "wss://rtserve.earthscope.org/seedlink";
const SCSN_SEEDLINK_V4 = "wss://eeyore.seis.sc.edu/testringserver/seedlink";
const SCSN_SEEDLINK = "wss://eeyore.seis.sc.edu/ringserver/seedlink";

const SEEDLINK = SCSN_SEEDLINK;

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
<sp-debug></sp-debug>
<h5>Generated with <a href="https://github.com/crotwell/seisplotjs">Seisplotjs version <span class="sp_version">3.1.5-SNAPSHOT</span></a>.</h5>

`;
}

sp.util.updateVersionText('.sp_version');

const sp_debug = document.querySelector("sp-debug");
function addToDebug(msg: string) {
  if (sp_debug) {
    sp_debug.debug(msg);
  };
}

createUpdatingClock();

let allStations = [];
let stationCheckboxes = [];
let colorForStation = null;
let currSta = null;


let stationCallback = function(sta) {
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

loadNetworks().then(nets => {
    rtConfig.networkList = nets;
    // in case packets arrive before stationxml
    rtDisp.rawSeisData.forEach(sdd => sdd.associateChannel(nets));
    rtDisp.organizedDisplay.seisData.forEach(sdd => sdd.associateChannel(nets));
});

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
      seedlink=null;
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

  document.querySelector("button#disconnect").textContent = "Disconnect";

  let requestConfig = [];

  stationCheckboxes.forEach(cb => {
    if (cb.checked) {
      requestConfig.push(`STATION ${cb.name} CO`);
      requestConfig.push("SELECT 00HH?");
    } else {
      let seisData = rtDisp.organizedDisplay.seisData;
      for (let i=0; i<seisData.length; i++) {
        if (seisData[i].stationCode === cb.name) {
          seisData.splice(i, 1);
        }
      }
      rtDisp.organizedDisplay.seisData = seisData;
      rtDisp.organizedDisplay.redraw();
    }
  });
  if (requestConfig.length === 0) {
    return;
  }

  let start = sp.luxon.DateTime.utc().minus(duration);
  if (!seedlink) {
    seedlink = new sp.seedlink.SeedlinkConnection(
      SEEDLINK,
      requestConfig,
      (packet) => {
        rtDisp.packetHandler(packet);
      },
      errorFn,
    );
    seedlink.logCommandFn = addToDebug;
    seedlink.setOnClose(() => {addToDebug("close seedlink connection");});
  }
  if (seedlink) {
    seedlink.requestConfig = requestConfig;
    seedlink.setTimeCommand(start);
    seedlink
      .connect()
      .then(() => addToDebug("connected"))
      .catch(function (error) {
        addToDebug(`Error: ${error.name} - ${error.message}`);
        console.assert(false, error);
      });
    stopped = false;
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


document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    if (seedlink) {
      seedlink.close();
      seedlink=null;
    }
  } else {
    displayStations();
  }
});
