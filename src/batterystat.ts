import './style.css';
import * as sp from 'seisplotjs';
import { loadKilovaultStats} from './jsonl_loader';
import type {KilovaultSOC} from './jsonl_loader';
import {
  doPlot,
  doText,
  createColors,
  createKeyCheckboxes,
  initTimeChooser,
  createStationCheckboxes,
  createUpdatingClock,
  timesort,
} from './statpage'
import {loadActiveStations} from './util';
import { Duration } from 'luxon';
import {createNavigation} from './navbar';

createNavigation();
const DO_TEXT_OUTPUT = false;

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
  <div class="nws">
    <h5>Current Sky Cover:</h5>
    <button id="loadNWS">Load Weather Forecast</button>
    <ul class="nws">
    </ul>
  </div>
  <div class="forecast">
    <h5>Station Forecast:</h5>
    <table class="forecast">
    </table>
  </div>
  <div><pre class="raw"></pre></div>
`;


let curKey = "percentCharge";
const kilovaultKeys = [
  "percentCharge", "current", "voltage", "temperature",
  "id", "cycles"
]
const allStations = ["JSC", 'CASEE', 'CSB', 'HAW', 'HODGE', 'PAULI', 'TEEBA', "BIRD", ]
let colorForStation = createColors(allStations);

let selectedStations = allStations.slice();

function batteryKey(kvKey) {
  if (kvKey === "percentCharge") {
    return "battery_level"
  }
}

function dataFn(d: KilovaultSOC): number {
  if (d.soc.length > 0) {
    const firstObj = d.soc[0];
    if (firstObj && firstObj[curKey]!= null) {
      return firstObj[curKey];
    } else if (firstObj && firstObj[batteryKey(curKey)]!= null) {
      return firstObj[batteryKey(curKey)];
    } else {
      return null;
    }
  } else {
    return null;
  }
}

function textDataFn(d: KilovaultSOC): string {
  if (d.soc.length == 0) {
    return "missing";
  }
  const firstObj = d.soc[0];
  if (firstObj[curKey]!=null) {
      return `${firstObj.id} ${firstObj[curKey]}`;
  } else {
    return "blank";
  }
}

function stationForecast() {
  loadActiveStations().then( stationList => {
    stationList.sort( (a,b) => {
      if (a.stationCode < b.stationCode) { return -1;}
      if (a.stationCode > b.stationCode) { return  1;}
      return 0;
    });
    const nwsUl = document.querySelector("table.forecast");
    nwsUl.innerHTML = '';

    const header = document.createElement("tr");
    header.appendChild(document.createElement("th"));
    nwsUl.appendChild(header);
    const forecastList = [];
    stationList.forEach( (sta, idx) => {
      const tr = document.createElement("tr");
      const staTd = document.createElement("th");
      staTd.textContent = `${sta.stationCode}: `;
      tr.appendChild(staTd);
      nwsUl.appendChild(tr);
      const forecastPromise = sp.nws.loadForecast(sta).then( forecast => {
        const textForecast = forecast.properties.periods
        .filter( curr => {
          if (curr.name === "Tonight" || curr.name.endsWith("Night")) {
            return false;
          }
          return true;
        })
        .forEach(( curr) => {
          if (idx === 0) {
            const forTd = document.createElement("th");
            forTd.textContent = `${curr.name}`;
            header.appendChild(forTd);
          }
          const iconTd = document.createElement("td");
          const iconEl = document.createElement("img");
          iconEl.setAttribute("src", curr.icon);
          iconTd.appendChild(iconEl);
          tr.appendChild(iconTd);
        });
        return forecast;
      }).catch(err => {

        const iconTd = document.createElement("td");
        iconTd.textContent = "Fail";
        tr.appendChild(iconTd);
      });
      forecastList.push(forecastPromise);
    });
    return Promise.all(forecastList);
  });
}

function nwsSkyCover() {
  const fetchInit = sp.util.defaultFetchInitObj();
  fetchInit["headers"] = {
      "accept": "application/ld+json"
    }

  const nwsList = [ "KCHS", "KCAE", "KGSP", "KUZA"];
  const promiseList = [];
  for (const nwsSta of nwsList) {
    const url = `https://api.weather.gov/stations/${nwsSta}/observations/latest?require_qc=false`
    const fetchProm = sp.util.doFetchWithTimeout(url, fetchInit).then(resp => {
      if (resp.ok) {
        const nwsJson = resp.json();
        return nwsJson;
      } else {
        throw new Error(`fetch ${nwsSta} not ok: ${resp.status}`)
      }
    });
    promiseList.push(sp.nws.nwsObservation(nwsSta));
  }
  return Promise.all(promiseList).then(nwsList => {
    const nwsDiv = document.querySelector("ul.nws");
    if (! nwsDiv) { throw new Error("Unable to find div for weather");}
    nwsList.forEach( nwsJson => {
      const nwsLine = document.createElement("li");
      const skyCover = nwsJson.properties.cloudLayers.reduce( (acc: string, curr: string) => `${acc} ${curr["amount"]}`, "");
      const staName = nwsJson.properties.stationName
      nwsLine.textContent = `${skyCover} - ${nwsJson.properties.stationId} ${staName}: ${nwsJson.properties.textDescription} at ${nwsJson.properties.timestamp}`;
      nwsDiv.appendChild(nwsLine);
    });
  });
}

function createKeyCheckbox(stat: KilovaultSOC) {
  const selector = 'div.datakeys';
  let statKeys = [];
  statKeys = statKeys.concat(kilovaultKeys);
  for(const key in stat) {
    if (key === 'time' || key === 'station' || key === 'soc' ) {
      continue;
    }
    statKeys.push(key);
  }

  createKeyCheckboxes(selector,
                      statKeys,
                      curKey,
                      (key)=>{
                        curKey = key;
                        dataPromise.then((allStats: Array<KilovaultSOC>) => {
                          doPlot("div.plot", allStats, dataFn, selectedStations, colorForStation);
                          return Promise.resolve(allStats);
                        });
                      });
  return stat;
}

function handleData(allStats: Array<KilovaultSOC>): Array<KilovaultSOC> {
  if (allStats.length > 0) {
    createKeyCheckbox(allStats[0]);
  }
  allStats.sort(timesort);
  let expandData: Array<KilovaultSOC> = []
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
  });

  if (DO_TEXT_OUTPUT) {
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
  }).then((allStats: Array<KilovaultSOC>) => {
    doPlot("div.plot", allStats, dataFn, selectedStations, colorForStation);
    if (DO_TEXT_OUTPUT) {
      // output raw values as text, for debugging
      doText("pre.raw",
              allStats,
              textDataFn,
              selectedStations,
            //  lineColors
            );
    }
  });
}

createStationCheckboxes(allStations, stationCallback, colorForStation);
createUpdatingClock();

const timeChooser = initTimeChooser(Duration.fromISO("P2DT120M"), (timerange => {
  dataPromise = loadKilovaultStats(selectedStations, timerange).then(handleData);
}));

let timerange = timeChooser.toInterval();
let dataPromise = loadKilovaultStats(selectedStations, timerange)
  .then(handleData)
  .then( (allStats) => {
    return allStats;
  }).catch( err => {
    console.log(`error in data: ${err}`);
    throw err;
  });

document.querySelector("#loadNWS").addEventListener("click", ()=> {
  console.log(`before sky cover`)
  return nwsSkyCover().then(() => stationForecast());
})
