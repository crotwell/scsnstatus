import {  DateTime } from 'luxon';
import {createNavigation} from './navbar';
import './style.css';
import * as sp from 'seisplotjs';

createNavigation();

const app = document.querySelector<HTMLDivElement>('#app')!

app.innerHTML = `
  <div class="plot">
  <h3>Stations:</h3>
  <div id="map"></div>
  <h3>South Carolina Seismic Network, CO</h3>
  <div class="scsn"></div>
  <h3>Other networks</h3>
  <div class="other"></div>
  </div>
  <div class="stations"></div>
  <div class="datakeys"></div>
  <div><pre class="raw"></pre></div>
`;

const map = new sp.leafletutil.QuakeStationMap();
map.setAttribute(sp.leafletutil.TILE_TEMPLATE, "http://www.seis.sc.edu/tilecache/NatGeo/{z}/{y}/{x}/");
map.setAttribute(sp.leafletutil.TILE_ATTRIBUTION, 'Tiles &copy; Esri &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC');
map.setAttribute(sp.leafletutil.ZOOM_LEVEL, "7");
map.setAttribute(sp.leafletutil.CENTER_LAT, "33.5");
map.setAttribute(sp.leafletutil.CENTER_LON, "-81");
map.setAttribute(sp.leafletutil.FIT_BOUNDS, "false");
document.querySelector("#map").appendChild(map);

const table = new sp.infotable.StationTable();
table.classList.add("scsn");
document.querySelector("div.scsn").appendChild(table);
const otherTable = new sp.infotable.StationTable();
otherTable.classList.add("other");
document.querySelector("div.other").appendChild(otherTable);

const stationsQuery = new sp.fdsnstation.StationQuery();
stationsQuery.networkCode('CO');
stationsQuery.queryStations().then( netList => {
  let stationList = Array.from(sp.stationxml.allStations(netList));
  table.stationList = stationList;
  console.log(`got ${stationList.length} stations ${table.stationList.length}`)
  for (const n of netList) {
    for (const s of n.stations) {
      if (s.isActiveAt()) {
        map.addStation(s);
      }
    }
  }
  map.redraw();
  return netList;
}).then(netList => {
  const outPromise = [];
  const staToDec = new Map();
  for (const n of netList) {
    for (const s of n.stations) {
      outPromise.push(magDec(s).then(d => {
        console.log(`${s.sourceId} ${d}`);
        staToDec.set(s.sourceId.toString(), d);
        return d;
      }));
    }
  }
  return Promise.all(outPromise).then(decList => {
    const colFn = (sta) => {
      return staToDec.get(sta.sourceId.toString());
    };
    table.addColumn("declination", "Mag Dec", colFn);
    console.log(`colFn: ${netList[0].stations[0].sourceId} -> ${colFn(netList[0].stations[0])}`);
    table.draw();
    return netList;
  });
});

const otherStationsQuery = new sp.fdsnstation.StationQuery();
const latLonBox = new sp.fdsncommon.LatLonBox(-83.75, -78.5, 31.0, 35.5);
otherStationsQuery.endAfter(DateTime.utc()).latLonRegion(latLonBox);
otherStationsQuery.queryStations().then( netList => {
  for (const n of netList) {
    for (const s of n.stations) {
      if (s.isActiveAt() && s.networkCode !== 'CO' && s.networkCode !== 'SY') {
        map.addStation(s, "other");
        otherTable.stationList.push(s);
      }
    }
  }
  map.colorClass("other", "lightgrey");
  map.redraw();
  otherTable.draw();
});

function magDec(station): Promise<number> {
  const accessKey = 'zNEw7';
  const url = `https://www.ngdc.noaa.gov/geomag-web/calculators/calculateDeclination?lat1=${station.latitude}&lon1=${station.longitude}&key=${accessKey}&resultFormat=json`;
  return sp.util.pullJson(url).then(magDecJson => {
    return magDecJson.result[0].declination;
  });
}
