import { Duration } from 'luxon';
import {createNavigation} from './navbar';
import {loadNetworks, SC_QUAKE_URL, SC_STATION_URL} from './util';
import './style.css';
import * as sp from 'seisplotjs';
import {Interval} from 'luxon';

createNavigation();

const app = document.querySelector<HTMLDivElement>('#app')!

app.innerHTML = `
  <div>
    <sp-timerange duration="P30DT0M"></sp-timerange>
    <button id="loadMonth">Month</button>
    <button id="loadYear">Year</button>
    <button id="loadAll">All</button>
  </div>
  <div class="showalleq show">
    <h3>Earthquakes:</h3>
    <sp-station-quake-map
      tileUrl="https://www.seis.sc.edu/tilecache/NatGeo/{z}/{y}/{x}"
      tileAttribution='Tiles &copy; Esri &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC'
      zoomLevel="7"
      centerLat="33.5" centerLon="-81"
      fitbounds="false">
    </sp-station-quake-map>
    <sp-quake-table>
    </sp-quake-table>
  </div>
  <div class="showquake hide">
    <sp-organized-display
      sort="distance"
      tileUrl="https://www.seis.sc.edu/tilecache/NatGeo/{z}/{y}/{x}"
      tileAttribution='Tiles &copy; Esri &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC'
    ></sp-organized-display>
  </div>
  <div class="datakeys"></div>
  <div><pre class="raw"></pre></div>
`;

let allQuakes = [];
export type PageState = {
  quakeList: Array<sp.quakeml.Quake>,
  channelList: Array<sp.stationxml.Channel>,
  dataset: sp.dataset.Dataset,
};

let pageState: PageState = {
  quakeList: [],
  channelList: [],
  dataset: new sp.dataset.Dataset(),
}

document.querySelector("sp-timerange").updateCallback = (timeRange) => {
    console.log( `Range: ${timeRange.start.toISO()} to ${timeRange.end.toISO()}`);
    displayForTime(timeRange, allQuakes);
}
function displayForTime(timeRange: Interval, quakes: Array<Quake>): Array<Quake> {
  const quakesInTime = allQuakes.filter(q => {
    return timeRange.start <= q.time && q.time <= timeRange.end;
  });
  let table = document.querySelector("sp-quake-table");
  table.quakeList = quakesInTime;
  let map = document.querySelector("sp-station-quake-map");
  map.quakeList = []
  map.addQuake(quakesInTime);
  map.draw();
}

const quakeQuery = sp.quakeml.fetchQuakeML(SC_QUAKE_URL);
const chanQuery = loadNetworks().then(staxml => {
  // filter so only HH? and HN?
  staxml.forEach(net=> {
    net.stations.forEach(sta => {
      sta.channels = sta.channels.filter(ch => ch.channelCode.startsWith("H") && (
          ch.channelCode.charAt(1) === 'H' || ch.channelCode.charAt(1) === 'N') &&
          ch.channelCode.charAt(2) === 'Z');
    });
    net.stations = net.stations.filter(sta => sta.channels.length > 0);
  });
  staxml = staxml.filter(net => net.stations.length > 0);
  return staxml;
});
Promise.all([ quakeQuery, chanQuery ]).then( ([qml, staxml]) => {
  console.log(`qml len: ${qml.length}`)
  pageState.quakeList = qml.eventList;
  pageState.dataset.inventory = staxml;
  pageState.channelList = Array.from(sp.stationxml.allChannels(staxml));

  let table = document.querySelector("sp-quake-table");
  allQuakes = qml.eventList;
  const trEl = document.querySelector("sp-timerange");
  displayForTime(trEl.getTimeRange(), allQuakes);
  console.log(`got ${qml.eventList.length} quakes ${table.quakeList.length}`)

});

function displayAllQuakes() {

}

function displayQuake(quake: sp.quakeml.Quake, pageState: PageState) {
  if ( quake == null) {
    displayAllQuakes();
  }
  document.querySelectorAll(".showquake").forEach( el => {
    el.classList.remove("hide");
    el.classList.add("show");
  });
  document.querySelectorAll(".showalleq").forEach( el => {
    el.classList.remove("show");
    el.classList.add("hide");
  });
  pageState.dataset.catalog = [ quake];
  let loader = new sp.seismogramloader.SeismogramLoader(
    pageState.dataset.inventory,
    pageState.dataset.catalog);
  loader.dataselectQuery = new sp.fdsndataselect.DataSelectQuery("eeyore.seis.sc.edu");
  //loader.dataselectQuery.port(8080)
  loader.endOffset = Duration.fromObject({minutes: 5});
  loader.load().then( ds => {
    console.log(`loader ${ds.waveforms.length} seismograms`);
    pageState.dataset = ds;
    ds.waveforms.forEach(sdd => {

      sdd.quakeList.forEach( quake => {
        const pickMarkers = sp.seismograph.createMarkerForPicks(
          quake.preferredOrigin, sdd.channel);
        sdd.addMarkers(pickMarkers);
        sdd.alignmentTime = quake.time;
      });
    });

    ds.processedWaveforms = ds.waveforms.map(sdd => {
      if (sdd.seismogram == null) {
        return sdd;
      }
      let out = sdd;
      //out = sdd.cloneWithNewSeismogram(sp.filter.rMean(sdd.seismogram));
      //out = sdd.cloneWithNewSeismogram(sp.filter.removeTrend(sdd.seismogram));
      //const highPass = sp.filter.createButterworth(2, sp.filter.BAND_PASS, 1.0, 20.0, sdd.seismogram.samplePeriod);
      //out = sdd.cloneWithNewSeismogram(sp.filter.applyFilter(highPass, out.seismogram));
      return out;
    });

    let orgDisp = document.querySelector("sp-organized-display");
    orgDisp.seismographConfig.doGain = true;
    orgDisp.seismographConfig.ySublabelIsUnits = true;
    orgDisp.seisData = ds.processedWaveforms;
  });
}

export const SELECTED_ROW = "selectedRow";

const quakeTable = document.querySelector("sp-quake-table");
quakeTable.addStyle(`
      td {
        padding-left: 5px;
        padding-right: 5px;
      }
      table tbody tr.${SELECTED_ROW} td {
        background-color: green;
        color: white;
      }
    `);
quakeTable.addEventListener("quakeclick", ce => {
  console.log(`quakeclick: ${ce.detail.quake}`);
  displayQuake(ce.detail.quake, pageState);
});
