import './style.css'
import {leafletutil, infotable, quakeml, version as sp_version} from 'seisplotjs';
import {createNavigation} from './navbar';
import {loadActiveStations, SC_QUAKE_URL} from './util';
import {Interval, Duration, DateTime} from 'luxon';

createNavigation();
const app = document.querySelector<HTMLDivElement>('#app')!

if (true) {
app.innerHTML = `
  <h1>South Carolina Seismic Network Status</h1>
  <sp-station-quake-map
    tileUrl="http://www.seis.sc.edu/tilecache/NatGeo/{z}/{y}/{x}"
    tileAttribution='Tiles &copy; Esri &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC'
    zoomLevel="7"
    centerLat="33.5" centerLon="-81"
    fitbounds="false">
  </sp-station-quake-map>

  <h3>Earthquakes in last month:</h3>
  <sp-quake-table>
  </sp-quake-table>

  <h5 class="spjsversion">Built using <a href="https://crotwell.github.io/seisplotjs/">spjs version</a>: ${sp_version}</h5>
`
}

const map = document.querySelector("sp-station-quake-map") as leafletutil.QuakeStationMap;
if (!map) {throw new Error("Can't find sp-station-quake-map");}
map.quakeList = [];
map.stationList = [];
loadActiveStations().then(staList => {
  map.stationList = staList;
  return staList;
}).then(staList => {
  const quakeTable = document.querySelector("sp-quake-table") as infotable.QuakeTable;
  if (!map) {throw new Error("Can't find sp-quake-table");}
  const quakePromise = quakeml.fetchQuakeML(SC_QUAKE_URL)
    .then(qml => {
      const monthAgo = Interval.before(DateTime.utc(), Duration.fromISO("P31DT0M"));
      qml.eventList = qml.eventList.filter( q=> monthAgo.contains(q.time));
      return qml;
    }).then(qml => {
      map.quakeList = []
      map.addQuake(qml.eventList);
      map.draw();
      quakeTable.quakeList = qml.eventList;
    });
  return Promise.all([staList, quakePromise]);
});
