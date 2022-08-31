import * as seisplotjs from 'seisplotjs';
import {loadCellStats, CellSOH} from './jsonl_loader.js';
import {scatterplot} from './scatterplot.js';
import { DateTime} from 'luxon';

export function grab(stationList: Array<string>, start: DateTime, end: DateTime) {
  return loadCellStats(stationList, start, end)
  .then(allStats => {
    return allStats;
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
const allStations = ["JSC", 'CASEE', 'HODGE']

let selectedStations = allStations.slice();

function doPlot(selector: string, allStats: Array<CellSOH>, key: string) {
  let filtered = allStats.filter((stat: CellSOH) => selectedStations.findIndex(s => s === stat.station) !== -1);
  let plotDiv = document.querySelector<HTMLDivElement>(selector);
  if (!plotDiv) {
    throw new Error(`Can't find element for selector '${selector}'`);
  }
  while (plotDiv.lastChild) {
    plotDiv.removeChild(plotDiv.lastChild);
  }
  if (filtered.length > 0) {
    scatterplot(selector, filtered, key, allStations, lineColors);
  } else {
    let p = plotDiv.appendChild(document.createElement("p"));
    p.textContent = "No Data";
  }
}

function handleData(allStats: Array<CellSOH>) {
  if (allStats.length > 0) {
    createKeyCheckbox(allStats[0]);
  }
  doPlot("div.plot", allStats, curKey);
  return allStats;
}

let start = seisplotjs.luxon.DateTime.fromISO("2022-05-15");
let end = start.plus(seisplotjs.luxon.Duration.fromObject({hours: 0, minutes: 5}));
const timeChooser = document.querySelector<seisplotjs.datechooser.TimeRangeChooser>(seisplotjs.datechooser.TIMERANGE_ELEMENT);
if (timeChooser) {
  const timerange = timeChooser.getTimeRange();
  start = timerange.start;
  end = timerange.end;
  let nowButton = document.querySelector<HTMLButtonElement>('#loadNow');
  if (nowButton) {
    nowButton.onclick = () => {
      timeChooser.end = seisplotjs.luxon.DateTime.utc();
    };
  }
  timeChooser.updateCallback = (timerange => {
    dataPromise = grab(selectedStations, timerange.start, timerange.end).then(handleData);
  });
}

let dataPromise = grab(allStations, start, end).then(handleData);

function createKeyCheckbox(stat: CellSOH) {
  const selector = 'div.datakeys';
  let keyDiv = document.querySelector<HTMLDivElement>(selector);
  if (!keyDiv) {
    throw new Error(`Can't find element for selecotor: ${selector}`);
  }
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
        cb.setAttribute('checked', "true");
      }
      cb.addEventListener('click', () => {
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

const stationCallback = function(sta: string, checked: boolean) {
  dataPromise.then(allStats => {
    if (checked) {
      selectedStations.push(sta);
    } else {
      selectedStations = selectedStations.filter(s => s !== sta);
    }
    return allStats;
  }).then(allStats => {
    doPlot("div.plot", allStats, curKey);
  });
}
const staSelector = 'div.stations';
const stationsDiv = document.querySelector<HTMLDivElement>(staSelector);
if (! stationsDiv) {
  throw new Error(`Can't find element with selector: ${staSelector}`)
}
let styleText = "";
allStations.forEach((sta, idx) => {
  const div = stationsDiv.appendChild(document.createElement('span'));
  const cb = div.appendChild(document.createElement('input'));
  cb.setAttribute('type','checkbox');
  cb.setAttribute('checked','true');
  cb.setAttribute('name', sta);
  cb.addEventListener('click', event => {
    const checkbox = event.target as HTMLInputElement;
    stationCallback(sta, checkbox && checkbox.checked);
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

const headEl = document.querySelector<HTMLElement>('head');
if (! headEl) { throw new Error(`Can't find head element`);}
const stationStyle = headEl.appendChild(document.createElement('style'));
stationStyle.appendChild(document.createTextNode(styleText));

const nowEl = document.querySelector<HTMLDivElement>("#nowtime");
if (nowEl) {
  setInterval(() => {
    let n = seisplotjs.luxon.DateTime.utc().set({millisecond: 0});
    nowEl.textContent = `${n.toISO({suppressMilliseconds: true})} UTC`
  }, 1000);
}
