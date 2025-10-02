import './style.css'
import * as sp from 'seisplotjs';
import {createNavigation} from './navbar';
import {loadActiveStations, SC_QUAKE_URL, SC_STATION_URL} from './util';

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

  <h5 class="spjsversion">Built using <a href="https://crotwell.github.io/seisplotjs/">spjs version</a>: ${sp.version}</h5>
`
}

let map = document.querySelector("sp-station-quake-map");
map.quakeList = []
loadActiveStations().then(staList => {
  map.addStation(staList);
  map.draw();
  return staList;
}).then(staList => {
  const quakePromise = sp.quakeml.fetchQuakeML(SC_QUAKE_URL)
    .then(qml => {
      const monthAgo = sp.luxon.Interval.before(sp.luxon.DateTime.utc(),
        sp.luxon.Duration.fromISO("P31DT0M"));
      qml.eventList = qml.eventList.filter( q=> monthAgo.contains(q.time));
      return qml;
    });
  return Promise.all([staList, quakePromise]);
}).then( ([staList, qml] ) => {
  map.quakeList = []
  map.addQuake(qml.eventList);
  map.draw();
  document.querySelector("sp-quake-table").quakeList = qml.eventList;
})
