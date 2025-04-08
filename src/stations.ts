import { Duration, DateTime } from 'luxon';
import {createNavigation} from './navbar';
import './style.css';
import * as sp from 'seisplotjs';

createNavigation();

const app = document.querySelector<HTMLDivElement>('#app')!

app.innerHTML = `
  <h5 id="nowtime">Now! And again! ${sp.version}</h5>
  <div>
    <sp-timerange duration="P2DT0M"></sp-timerange>
    <button id="loadToday">Today</button>
    <button id="loadNow">Now</button>
  </div>
  <div class="plot">
  <h3>Stations:</h3>
  <sp-station-quake-map
    tileUrl="http://www.seis.sc.edu/tilecache/NatGeo/{z}/{y}/{x}/"
    tileAttribution='Tiles &copy; Esri &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC'
    zoomLevel="7"
    centerLat="33.5" centerLon="-81"
    fitbounds="false">
  </sp-station-quake-map>
  <sp-station-table></sp-station-table>
  </div>
  <div class="stations"></div>
  <div class="datakeys"></div>
  <div><pre class="raw"></pre></div>
`;

const stationsQuery = new sp.fdsnstation.StationQuery();
stationsQuery.networkCode('CO');
stationsQuery.queryStations().then( netList => {
  let stationList = Array.from(sp.stationxml.allStations(netList));
  let table = document.querySelector("sp-station-table");
  table.stationList = stationList;
  console.log(`got ${stationList.length} stations ${table.stationList.length}`)
  let map = document.querySelector("sp-station-quake-map");
  for (const n of netList) {
    for (const s of n.stations) {
      if (s.isActiveAt()) {
        map.addStation(s);
      }
    }
  }
  map.redraw();
});
const otherStationsQuery = new sp.fdsnstation.StationQuery();
const latLonBox = new sp.fdsncommon.LatLonBox(-83.75, -78.5, 31.0, 35.5);
otherStationsQuery.endAfter(DateTime.utc()).latLonRegion(latLonBox);
otherStationsQuery.queryStations().then( netList => {
  let map = document.querySelector("sp-station-quake-map");
  let table = document.querySelector("sp-station-table");
  for (const n of netList) {
    for (const s of n.stations) {
      if (s.isActiveAt() && s.networkCode !== 'CO' && s.networkCode !== 'SY') {
        map.addStation(s, "other");
        table.stationList.push(s);
      }
    }
  }
  map.colorClass("other", "lightgrey");
  map.redraw();
  table.draw();
  });
