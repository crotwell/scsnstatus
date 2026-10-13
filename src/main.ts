import './style.css'
import {leafletutil, infotable, quakeml, version as sp_version} from 'seisplotjs';
import {createNavigation} from './navbar';
import {loadActiveStations, SC_QUAKE_URL} from './util';
import {Interval, Duration, DateTime} from 'luxon';
import * as sp from 'seisplotjs';


createNavigation();
const app = document.querySelector<HTMLDivElement>('#app')!

if (true) {
app.innerHTML = `
  <h1>South Carolina Seismic Network Status</h1>
  <div id="map"></div>

  <h3>Earthquakes in last month:</h3>
  <div id="table"></div>

  <h5 class="spjsversion">Built using <a href="https://crotwell.github.io/seisplotjs/">spjs version</a>: ${sp_version}</h5>
`
}


const map = new sp.leafletutil.QuakeStationMap();
map.setAttribute(sp.leafletutil.TILE_TEMPLATE, "http://www.seis.sc.edu/tilecache/NatGeo/{z}/{y}/{x}/");
map.setAttribute(sp.leafletutil.TILE_ATTRIBUTION, 'Tiles &copy; Esri &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC');
map.setAttribute(sp.leafletutil.ZOOM_LEVEL, "7");
map.setAttribute(sp.leafletutil.CENTER_LAT, "33.5");
map.setAttribute(sp.leafletutil.CENTER_LON, "-81");
map.setAttribute(sp.leafletutil.FIT_BOUNDS, "false");
document.querySelector("#map").appendChild(map);

const quakeTable = new sp.infotable.QuakeTable();
document.querySelector("#table").appendChild(quakeTable);


map.quakeList = [];
map.stationList = [];
loadActiveStations().then(staList => {
  map.stationList = staList;
  return staList;
}).then(staList => {
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
