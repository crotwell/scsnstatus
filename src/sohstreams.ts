import {loadActiveStations, stationList, loadAllChannels} from './util';
import * as sp from 'seisplotjs';
import './style.css';
import {
  doPlot,
  createColors,
  createKeyCheckboxes,
  initTimeChooser,
  createStationCheckboxes,
  createUpdatingClock,
} from './statpage.js'
import { Duration} from 'luxon';
import {createNavigation} from './navbar';

const MSEED_URL = "https://eeyore.seis.sc.edu/mseed";
const KEY_MASSPOS = "MassPos";
const KEY_CLOCK_QUAL = "ClockQual";
const KEY_CLOCK_PHASE = "ClockPhase";

let KEY_LIST = [ KEY_MASSPOS, KEY_CLOCK_QUAL, KEY_CLOCK_PHASE ];
let curKey = KEY_LIST[0];

createNavigation();

const app = document.querySelector<HTMLDivElement>('#app')!

app.innerHTML = `
  <h5 id="nowtime">Now!</h5>
  <h5>SOH STREAMS!</h5>
  <div>
    <sp-timerange duration="P1DT120M"></sp-timerange>
    <button id="loadToday">Today</button>
    <button id="loadNow">Now</button>
  </div>
  <div class="datakeys"></div>
  <div class="plot">
  <sp-organized-display
    sort=${sp.sorting.SORT_ALPHABETICAL}
    tileUrl="http://www.seis.sc.edu/tilecache/NatGeo/{z}/{y}/{x}"
    tileAttribution='Tiles &copy; Esri &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC'
  ></sp-organized-display>
  </div>
  <div class="stations"></div>
  <svg></svg>
`;

let mseedQ = new sp.mseedarchive.MSeedArchive(
  MSEED_URL,
  "%n/%s/%Y/%j/%n.%s.%l.%c.%Y.%j.%H",
);


let orgDisp = document.querySelector("sp-organized-display");
orgDisp.seismographConfig.doGain = false;
orgDisp.seismographConfig.ySublabelIsUnits = true;
orgDisp.seismographConfig.amplitudeWithZero();
orgDisp.seismographConfig.wheelZoom = false;
orgDisp.overlayby = sp.organizeddisplay.OVERLAY_ALL;
orgDisp.seisData = [];

function makePlot(key) {
  orgDisp.seisData = [];
  const sourceCode = [];
  const subsourceCode = [];
  if (key === KEY_CLOCK_QUAL) {
    sourceCode.push("C");
    subsourceCode.push("Q");
  } else if (key === KEY_MASSPOS) {
    sourceCode.push("M");
    subsourceCode.push("U");
    subsourceCode.push("V");
    subsourceCode.push("W");
  } else {
    sourceCode.push("C");
    subsourceCode.push("E");
  }
  if (key === KEY_CLOCK_QUAL || key === KEY_CLOCK_PHASE) {
    orgDisp.seismographConfig.linkedAmplitudeScale = new sp.scale.IndividualAmplitudeScale();
  } else if (key === KEY_MASSPOS) {
    orgDisp.seismographConfig.fixedAmplitudeScale = [-35, 35];
  }
  loadAllChannels().then(staList => {

    staList.forEach(sta => {
      sta.channels = sta.channels.filter(ch => (
        ch.channelCode.startsWith("L") || ch.channelCode.startsWith("V")) &&
          sourceCode.includes(ch.channelCode.charAt(1)) &&
          subsourceCode.includes(ch.channelCode.charAt(2))
        );
    });

    return staList;
  }).then(staList => {
    const timeRange = document.querySelector("sp-timerange").getTimeRange();
    const promiseList = new Array();
    staList.forEach(sta => {
      const sddList = new Array();
      sta.channels.forEach(chan => {
        if (!chan.isActiveAt()) {return;}
        const sdd = sp.seismogram.SeismogramDisplayData.fromChannelAndTimeWindow(chan, timeRange);
        sddList.push(sdd);
      });
      const seisGetter = mseedQ.loadSeismograms(sddList).then(staSddList => {
          orgDisp.appendSeisData(staSddList);
          return staSddList;
        });
      promiseList.push(seisGetter);
    });
    return promiseList;
  }).then(sddListList => {
    console.log(`loaded ${sddListList.size} stations`);
  }).catch(reason => {
    console.log(`error loading ${reason} `);
    console.warn(false, reason);
  });
}


function createKeyCheckbox(keys: Array<String>) {
  const selector = 'div.datakeys';
  let statKeys = [];
  for(const key of keys) {
    if (key === 'time' || key === 'station' || key === 'sysDescr') {
      continue;
    }
    statKeys.push(key);
  }
  createKeyCheckboxes(selector,
                      statKeys,
                      curKey,
                      (key)=>{
                        curKey = key;
                        makePlot(curKey);
                      });
}

createKeyCheckbox(KEY_LIST);
makePlot(curKey);
