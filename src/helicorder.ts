import './style.css'
import * as sp from 'seisplotjs';
import {
  doPlot,
  redrawHeli,
  getNowTime,
  drawSeismograph,
} from "./heli/doplot.js";
import {
  updatePageForConfig,
  setupEventHandlers,
  enableFiltering,
  loadAllEarthquakeQueryParams,
} from "./heli/controls.js";
import {stationList} from './util.js';

const d3 = sp.d3;
const luxon = sp.luxon;

import {createNavigation} from './navbar';

createNavigation();
const app = document.querySelector<HTMLDivElement>('#app')!

if (true) {
app.innerHTML = `

<div id="scsnStations">
  <label class="sectionlabel" title="Stations within the South Carolina Seismic Network">Stations:</label>
</div>
<div>
  <span id="loccode"><label class="sectionlabel">Loc Code: </label></span>
  <span id="instruments"><label class="sectionlabel">Instrument: </label></span>
  <span id="orientations"><label class="sectionlabel">Orientation: </label></span>
</div>

<div id="times">
  <label class="sectionlabel">Time Range: </label>
  <button id="loadToday">Today</button>
  <button id="loadNow">Now</button>
  <button id="loadPrev">Previous</button>
  <button id="loadNext">Next</button>
  <sp-datetime></sp-datetime>
  <label class="sectionlabel">Click Interval: </label>
  <input id="clickinterval" class="smallnum" type="text" value="PT5M"></input>
  <label class="sectionlabel">Mouse: </label><span id="mousetime"></span>
</div>

<details>
  <summary class="sectionlabel">Configure</summary>
  <div id="minmax">
  <label class="sectionlabel" title="Load MinMax">Load: </label>
  <span>
    <input type="checkbox" id="minmax" class="shape" name="ampMode" value="0" checked="true"/>
    <label for="minmax">Load Min Max Only </label>
  </span>
</div>
<div id="amp">
  <label class="sectionlabel" title="Amplitude Range">Amp Range: </label>
  <span>
    <input type="radio" id="maxAmp" class="shape" name="ampMode" value="0" checked="true"/>
    <label for="fixedAmpText">Max Value </label>
  </span>
  <span>
    <input type="radio" id="fixedAmp" class="shape" name="ampMode" value="1"/>
    <label for="fixedAmpText">Fixed: </label>
    <input class="smallnum" type="text" id="fixedAmpText" name="fixedAmp" pattern="[1-9][0-9]*" value="10000"/>
  </span>
  <span>
    <input type="radio" id="percentAmp" class="shape" name="ampMode" value="2">
    <label for="percentAmpSlider">Percent: </label>
    <input class="smallnum" type="range" min="1" max="100" id="percentAmpSlider" value="100"><span id="percentValue">100</span>
  </span>
  <span>
    <input type="checkbox" id="rmean" class="shape" name="rmean" value="0" checked="true"/>
    <label for="rmean">Remove Mean </label>
  </span>
</div>
<div id="filtering">
  <label class="sectionlabel" title="Filtering">Filtering: </label>
  <span>
    <input type="radio" id="allpass" name="filter" value="allpass" checked="true"></input>
    <label for="allpass">None</label>
  </span>
  <span>
    <input type="radio" id="lowpass" name="filter" value="lowpass" ></input>
    <label for="lowpass">Lowpass</label>
  </span>
  <span>
    <input type="radio" id="bandpass" name="filter" value="bandpass" ></input>
    <label for="bandpass">Bandpass</label>
  </span>
  <span>
    <input type="radio" id="highpass" name="filter" value="highpass" ></input>
    <label for="highpass">Highpass</label>
  </span>
  <label for="lowcut">Low Cut: </label>
  <input class="smallnum" type="text" id="lowcut" name="lowcut" value="1.0"></input>
  <label for="highcut">High Cut: </label>
  <input class="smallnum" type="text" id="highcut" name="highcut" value=10.0></input>
</div>

<details>
  <summary class="sectionlabel">Query Earthquakes</summary>
  <div id="eqquery">
    <div>
      <button id="refreshEarthquakes">Refresh Earthquakes</button>
    </div>
    <div id="local">
      <h5>Local Earthquakes:</h5>
      <label>Min Lat: </label><input type="text" id="localMinLat" name="localMinLat" pattern="-?[1-9][0-9]*(\.[0-9]*)?" value="31.75"/>
      <label>Max Lat: </label><input type="text" id="localMaxLat" name="localMaxLat" pattern="-?[1-9][0-9]*(\.[0-9]*)?" value="35.5"/>
      <label>Min Lon: </label><input type="text" id="localMinLon" name="localMinLon" pattern="-?[1-9][0-9]*(\.[0-9]*)?" value="-84"/>
      <label>Max Lon: </label><input type="text" id="localMaxLon" name="localMaxLon" pattern="-?[1-9][0-9]*(\.[0-9]*)?" value="-78"/>
    </div>
    <div id="regional">
      <h5>Regional Earthquakes:</h5>
      <label>Max Radius: </label><input type="text" id="regionalMaxRadius" name="regionalMaxRadius" pattern="-?[1-9][0-9]*(\.[0-9]*)?" value="20"/>
      <label>Min Mag: </label><input type="text" id="regionalMinMag" name="regionalMinMag" pattern="-?[1-9][0-9]*(\.[0-9]*)?" value="4.5"/>
    </div>
    <div id="global">
      <h5>Global Earthquakes:</h5>
      <label>Min Mag: </label><input type="text" id="globalMinMag" name="globalMinMag" pattern="-?[1-9][0-9]*(\.[0-9]*)?" value="6"/>
    </div>
  </div>
</details>

</details>

<h5><span class="textNetCode"></span>.<span class="textStaCode"></span>.<span class="textLocCode">00</span>.<span class="textChanCode">H??</span> from <span class="startTime"></span> to <span class="endTime"></span>.</h5>
<details id="messagesParent">
  <summary class="sectionlabel">Messages:</summary>
  <div id="messages">
  </div>
</details>

<div id='heli'>
  <sp-helicorder></sp-helicorder>
</div>
<div id='seismograph' style="display: none;">
  <div>
    <button id="goheli">Helicorder</button>
    <button id="reload">Load More</button>
  </div>
  <sp-organized-display info="false" map="false"></sp-organized-display>
</div>

<p>Note that data may be delayed up to 15 minutes due to buffering.</p>



<h5>Generated with <a href="https://github.com/crotwell/seisplotjs">Seisplotjs version <span class="sp_version">3.1.5-SNAPSHOT</span></a>.</h5>

`;

sp.util.updateVersionText('.sp_version');
}



const DEFAULT_FIXED_AMP = 10000;

// state preserved for browser history
// also see near bottom where we check if page history has state obj and use that
let state = {
  netCodeList: ["CO", "N4"],
  stationList: stationList,
  bandCodeList: ["H", "L"],
  instCodeList: ["H", "N"],
  orientationCodeList: ["Z", "N", "E", "1", "2"],
  netCode: "CO",
  station: null,
  locCode: "00",
  bandCode: "H",
  instCode: "H",
  orientationCode: "Z",
  altOrientationCode: "",
  endTime: "now",
  duration: "P1D",
  dominmax: true,
  amp: "max",
  rmean: false,
  filter: {
    type: "allpass",
    lowcut: "1.0",
    highcut: "10.0",
  },
  quakes: {
    local: [],
    regional: [],
    global: [],
    accesstime: null,
  },
  centerTime: "now",
  halfWidth: luxon.Duration.fromISO("PT5M"),
};

let savedData = {
  config: state,
};
// set current station if query param on url
const url = new URL(document.location.href);
if (url.searchParams.get("station")) {
  let netSta = url.searchParams.get("station").replace('.', '_');
  let sid = sp.fdsnsourceid.StationSourceId.parse(netSta)
  state.station = sid.stationCode;
  state.netCode = sid.networkCode;
}

function loadAndPlot(config) {
  updatePageForConfig(config);
  doPlot(config).then((hash) => {
    if (hash) {
      savedData = hash;
    }
  });
}

function redraw() {
  if (
    window.getComputedStyle(document.querySelector("#heli")).display === "none"
  ) {
    savedData.centerTime = savedData.config.centerTime;
    drawSeismograph(savedData);
  } else {
    if (savedData && savedData.seisData) {
      // already have data
      redrawHeli(savedData);
    } else {
      loadAndPlot(state);
    }
  }
}

// Check browser state, in case of back or forward buttons
let currentState = window.history.state;

if (currentState) {
  updatePageForConfig(currentState);
  if (currentState.station) {
    state = currentState;
    loadAndPlot(state);
  }
} else {
  loadAndPlot(state);
}
// also register for events that change state
window.onpopstate = function (event) {
  if (event.state && event.state.station) {
    state = event.state;
    updatePageForConfig(state);
    loadAndPlot(state);
  }
};

let paused = false;
let stopped = false;
let numSteps = 0;

let heli = null;

let chooserEnd;
if (state.endTime) {
  if (state.endTime === "now") {
    chooserEnd = getNowTime();
  } else {
    chooserEnd = sp.util.isoToDateTime(state.endTime);
  }
} else {
  state.endTime = "now";
  chooserEnd = luxon.DateTime.utc();
}
const chooserStart = chooserEnd.minus(luxon.Duration.fromISO(state.duration));

let throttleRedisplay = null;
let throttleRedisplayDelay = 500;

let dateChooser = document.querySelector("sp-datetime");
dateChooser.time = chooserStart;
dateChooser.updateCallback = (time) => {
  if (throttleRedisplay) {
    window.clearTimeout(throttleRedisplay);
  }
  throttleRedisplay = window.setTimeout(() => {
    let updatedTime = time.plus(luxon.Duration.fromISO(state.duration));
    state.endTime = updatedTime.toISO();
    loadAndPlot(state);
  }, throttleRedisplayDelay);
};

setupEventHandlers(state, loadAndPlot, redraw);

document
  .querySelector("button#refreshEarthquakes")
  .addEventListener("click", () => {
    loadAllEarthquakeQueryParams(state);
    loadAndPlot(state);
  });
