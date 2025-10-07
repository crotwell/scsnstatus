import './style.css'
import * as sp from 'seisplotjs';
import {setupStationRadioButtons} from './heli/controls';
import {showMessage, clearMessages} from './heli/doplot';
import type {LatencyVoltage} from './jsonl_loader';
import {
  doPlot,
  createColors,
} from './statpage.js'
import {stationList} from './util';

const luxon = sp.luxon;

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
  <button id="loadToday">Today</button>
  <button id="loadNow">Now</button>
  <button id="loadPrev">Previous</button>
  <button id="loadNext">Next</button>
  <sp-datetime></sp-datetime>
  <label class="sectionlabel">Mouse: </label><span id="mousetime"></span>
</div>

<details id="messagesParent">
  <summary class="sectionlabel">Messages:</summary>
  <div id="messages">
  </div>
</details>

<h5>Voltage</h5>
<div class='plot'>
</div>

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
  duration: "P1D",
  dominmax: true,
  amp: "max",
  rmean: false,
  filter: {
    type: "allpass",
    lowcut: "1.0",
    highcut: "10.0",
  },
};

export class CellStatusService {

  relativeURL = '/scsn/cell-stats/';
  baseURL = 'http://eeyore.seis.sc.edu'+this.relativeURL;
  cache = [];
  maxCacheLength = 100;

  queryCellStatus(station: string, year: number, dayofyear: number) {
    const today = sp.luxon.DateTime.utc();
    if (year !== today.year || dayofyear !== today.ordinal) {
      // only look in cache if not "today" so we get updates
      // careful of int vs string with ===
      const yearStr = ""+year;
      let dayofyearStr = ""+dayofyear;
      if (dayofyearStr.length === 1) { dayofyearStr = `0${dayofyearStr}`;}
      if (dayofyearStr.length === 2) { dayofyearStr = `0${dayofyearStr}`;}
      let cachedValue = this.cache.find( cellStat => {
        return cellStat["dayofyear"] === dayofyearStr
          && cellStat["station"] === station && cellStat["year"] === yearStr;
      });
      if (cachedValue) {
        return Promise.resolve(cachedValue);
      }
    }
    let url = `https://eeyore.seis.sc.edu:${this.relativeURL}${year}/${dayofyear}/${station}.json`;
    return sp.util.doFetchWithTimeout(url, null, 10)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Response status: ${response.status}`);
        }
        return response.json();
      }).then(json => {
        if (year !== today.year || dayofyear !== today.ordinal) {
          // only push non-today
          this.cache.push(json);
        }
        while (this.cache.length > this.maxCacheLength) {
          this.cache.shift();
        }
        return json;
      }).catch(error => {
        console.log(error);
        console.log("...returning valid but empty value.")
        return this.emptyCellStatus(station, year, dayofyear);
      });

  }

  emptyCellStatus(station: string, year: number, dayofyear: number) {
    return {
      "station": station,
      "dayofyear": dayofyear,
      "values": [],
      "year": year
    };
  }
}

const cellStatusService = new CellStatusService();

function loadAndPlot(config) {
  if (config.station) {
    clearMessages();
    const today = sp.luxon.DateTime.utc();
    const weekAgo = today.minus(sp.luxon.Duration.fromISO("P7D"));
    const promiseList = [];
    let dayToGet = weekAgo;
    while (dayToGet.toMillis() <= today.toMillis()) {
      dayToGet = dayToGet.plus({days: 1});
      promiseList.push(cellStatusService.queryCellStatus(config.station, dayToGet.year, dayToGet.ordinal)
      .then( jsonData => {
        return parseLatency(jsonData);
      }));
    }
    Promise.all(promiseList)
    .then(listOfdohList => {
      let dohList: Array<LatencyVoltage> = [];
      for (let dayList of listOfdohList) {
        dohList = dohList.concat(dayList);
      }
      return dohList;
    }).then( dohList => {
      doPlotInner(config, dohList);
    });
  } else {
    showMessage(`No station selected... ${config.station}`);
  }
}

function parseLatency(jsonData): Array<LatencyVoltage> {

  let dohList: Array<LatencyVoltage> = [];
  for (let v of jsonData["values"]) {
    const doh = {
      station: jsonData["station"],
      time: sp.util.isoToDateTime(v["time"]),
      volt: parseFloat(v["volt"]),
      eeyore: v["latency"]["eeyore"],
      thecloud: v["latency"]["thecloud"],
      iris: v["latency"]["iris"]
    };
    dohList.push(doh);
  }
  return dohList;
}

setupStationRadioButtons(state, loadAndPlot);

function doPlotInner(state, dohList) {
  let voltList = "";
  let n = 0
  for (let v of dohList) {
    voltList += `${v.time} ${v.volt}\n`;
    n+=1;
    if (n>10) {break;}
  }
  let colorForStation = createColors(state.stationList);
  const xRange = null;
  const yRange = [11, 15]
  doPlot("div.plot",
          dohList,
          doh => doh.volt,
          [state.station],
          colorForStation,
          xRange, yRange);
}

// Check browser state, in case of back or forward buttons
let currentState = window.history.state;

if (currentState) {
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
    loadAndPlot(state);
  }
};


let chooserEnd;
if (!state.endTime) {
  state.endTime = "now";
}
chooserEnd = sp.util.checkStringOrDate(state.endTime);
const chooserStart = chooserEnd.minus(luxon.Duration.fromISO(state.duration));

let throttleRedisplay: null | number = null;
let throttleRedisplayDelay = 500;

let dateChooser = document.querySelector("sp-datetime") as sp.datechooser.DateTimeChooser;
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
