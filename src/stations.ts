import { Duration } from 'luxon';
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

});
