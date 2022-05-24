import * as seisplotjs from 'seisplotjs';
import {loadStats, CellSOH} from './jsonl_loader.js';
import {scatterplot} from './scatterplot.js';
import { DateTime} from 'luxon';

export function grab(stationList: Array<string>, start: DateTime, end: DateTime) {
  return loadStats(stationList, start, end)
  .then(allStats => {
    // for (const stat of allStats) {
    //   console.log(`${station}: ${stat['powerIn']}`)
    // }
    return allStats;
  });
}



console.log(`seisplotjs: ${seisplotjs.version}`)
const app = document.querySelector<HTMLDivElement>('#app')!

app.innerHTML = `
  <h5 id="nowtime">Now!</h5>
  <div>
    <time-range-chooser duration="P0DT5M"></time-range-chooser>
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
const allStations = ["JSC", 'CASEE', 'HODGE']

let selectedStations = allStations.slice();

function doPlot(selector, allStats, key) {
  console.log(`doPlot stations: ${selectedStations}`)
  let filtered = allStats.filter(stat => selectedStations.findIndex(s => s === stat.station) !== -1);
  let plotDiv = document.querySelector<HTMLDivElement>(selector);
  while (plotDiv.firstChild) {
    plotDiv.removeChild(plotDiv.lastChild);
  }
  if (filtered.length > 0) {
    scatterplot(selector, filtered, key, allStations, lineColors);
  } else {
    let p = plotDiv.appendChild(document.createElement("p"));
    p.textContent = "No Data";
  }
}

let start = seisplotjs.luxon.DateTime.fromISO("2022-05-15");
let end = start.plus(seisplotjs.luxon.Duration.fromObject({hours: 0, minutes: 5}));
let timeChooser = document.querySelector<seisplotjs.datachooser.TimeRangeChooser>('time-range-chooser');
if (timeChooser) {
  const timerange = timeChooser.getTimeRange();
  start = timerange.start;
  end = timerange.end;
}
let nowButton = document.querySelector<HTMLButton>('#loadNow');
nowButton.onclick = (e) => {
  timeChooser.end = seisplotjs.luxon.DateTime.utc();
};

function handleData(allStats) {
  //console.log(`got allStats: ${allStats.length}`);
  //
  if (allStats.length > 0) {
    createKeyCheckbox(allStats[0]);
  }
  doPlot("div.plot", allStats, curKey);
  return allStats;
}
let dataPromise = grab(allStations, start, end).then(handleData);
timeChooser.updateCallback = (timerange => {
  dataPromise = grab(selectedStations, timerange.start, timerange.end).then(handleData);
})

function createKeyCheckbox(stat) {
  let keyDiv = document.querySelector<HTMLDivElement>('div.datakeys');
  console.log(`${JSON.stringify(stat)}`)
  for(const key in stat) {
    if (key === 'time' || key === 'station' || key === 'sysDescr') {
      continue;
    }
    if (!keyDiv.querySelector(`span.${key}`)) {
      const div = keyDiv.appendChild(document.createElement('span'));
      div.setAttribute('class', key);
      const cb = div.appendChild(document.createElement('input'));
      cb.setAttribute('type','radio');
      cb.setAttribute('name', 'radiokey');
      if (curKey === key) {
        cb.setAttribute('checked', true);
      }
      cb.addEventListener('click', event => {
        curKey = key;
        dataPromise.then(allStats => {
          doPlot("div.plot", allStats, key);
        });
      });
      const nlabel = div.appendChild(document.createElement('label'));
      nlabel.textContent = key;
    }
  }

}

const stationCallback = function(sta, checked) {
  dataPromise.then(allStats => {
    if (checked) {
      console.log(`checked ${sta}`)
      selectedStations.push(sta);
    } else {
      console.log(`unchecked ${sta}`)
      selectedStations = selectedStations.filter(s => s !== sta);
    }
    return allStats;
  }).then(allStats => {
    doPlot("div.plot", allStats, curKey);
  });
}
let stationsDiv = document.querySelector<HTMLDivElement>('div.stations');

let styleText = "";
allStations.forEach((sta, idx) => {
  const div = stationsDiv.appendChild(document.createElement('span'));
  const cb = div.appendChild(document.createElement('input'));
  cb.setAttribute('type','checkbox');
  cb.setAttribute('checked','true');
  cb.setAttribute('name', sta);
  cb.addEventListener('click', event => {
    stationCallback(sta, event.target.checked);
  });
  const nlabel = div.appendChild(document.createElement('label'));
  nlabel.setAttribute('class', sta);
  nlabel.textContent = sta;
  styleText = `${styleText}
  .${sta} {
    color: ${lineColors[idx]};
  }
  `;
});
const stationStyle = document.querySelector<HTMLElement>('head').appendChild(document.createElement('style'));
stationStyle.appendChild(document.createTextNode(styleText));

const nowEl = document.querySelector<HTMLDivElement>("#nowtime");
if (nowEl) {
  setInterval(() => {
    let n = seisplotjs.luxon.DateTime.utc().set({millisecond: 0});
    nowEl.textContent = `${n.toISO({suppressMilliseconds: true})} UTC`
  }, 1000);
}
