import './style.css';
import { loadComputerStat, ComputerStat} from './jsonl_loader.js';
import {
  doPlot,
  doText,
  createColors,
  createKeyCheckboxes,
  initTimeChooser,
  createStationCheckboxes,
  createUpdatingClock,
  timesort,
} from './statpage.js'
import { Duration } from 'luxon';
import {createNavigation} from './navbar';

createNavigation();

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
  <div><pre class="raw"></pre></div>
`;


let curKey = "du";
const allStations = ["JSC", 'CASEE', 'CSB', 'HAW', 'HODGE', 'PAULI', 'TEEBA', "BIRD", ]
let colorForStation = createColors(allStations);

let selectedStations = allStations.slice();


function dataFn(d: ComputerStat): number {
  if (curKey === "du") {
    const firstObj = d.du[0];
    if (firstObj && 'percentused' in firstObj && firstObj.percentused) {
      return firstObj.percentused;
    } else {
      return 0;
    }
  } else if (curKey === "temp") {
    if ('temp' in d) {
      return d.temp;
    } else {
      return 0;
    }
  } else {
    return 0;
  }
}

function textDataFn(d: ComputerStat): string {
  if (curKey === "du") {
    const firstObj = d.du[0];
    if (firstObj && 'percentused' in firstObj ) {
      if (firstObj.percentused) {
        return `${firstObj.path} ${firstObj.percentused}`;
      } else {
        return `undef`;
      }
    } else {
      return "missing";
    }
  } else if (curKey === "temp") {
    if ('temp' in d) {
      return `${d.id} ${d.temp}`
    } else {
      return `undef`;
    }
  } else {
    return "";
  }
}

function createKeyCheckbox(stat: ComputerStat) {
  const selector = 'div.datakeys';
  let statKeys = [];
  for(const key in stat) {
    if (key === 'time' || key === 'station' ) {
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
                          doPlot("div.plot", allStats, dataFn, selectedStations, colorForStation);
                        });
                      });
}

function handleData(allStats: Array<ComputerStat>) {
  if (allStats.length > 0) {
    createKeyCheckbox(allStats[0]);
  }
  allStats.sort(timesort);
  let expandData: Array<ComputerStat> = []
  if (curKey === "du") {
    allStats.forEach(stat => {
      if (stat.du.length > 1) {
        stat.du.forEach(s => {
          const d = structuredClone(stat);
          d.du = [ s ]; // clone but with only one du
          d.time = stat.time
          expandData.push(d)
        })
      } else {
        expandData.push(stat);
      }
    });
    expandData = expandData.filter(stat => stat.du[0] && 'percentused' in  stat.du[0] && stat.du[0].percentused >= 0 && stat.du[0].percentused <= 100);
  } else if (curKey === "temp") {
    expandData = expandData.filter(stat => stat.temp && stat.temp >= 0 && stat.temp <= 100);
  } else {
    expandData = allStats;
  }

  if (true) {
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
  }).then(allStats => {
    doPlot("div.plot", allStats, dataFn, selectedStations, colorForStation);
  });
}

createStationCheckboxes(allStations, stationCallback, colorForStation);
createUpdatingClock();

const timeChooser = initTimeChooser(Duration.fromISO("P2DT120M"), (timerange => {
  dataPromise = loadComputerStat(selectedStations, timerange).then(handleData);
}));

let timerange = timeChooser.toInterval();
let dataPromise = loadComputerStat(selectedStations, timerange).then(handleData);
