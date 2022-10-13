import { Duration } from 'luxon';
import {createNavigation} from './navbar';
import './style.css';
import * as seisplotjs from 'seisplotjs';

createNavigation();

const app = document.querySelector<HTMLDivElement>('#app')!

app.innerHTML = `
  <h5 id="nowtime">Now! And again! ${seisplotjs.version}</h5>
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
  <a href="https://vitejs.dev/guide/features.html" target="_blank">Documentation</a>
`;

const stationsQuery = new seisplotjs.fdsnstation.StationQuery();
stationsQuery.networkCode('CO');
stationsQuery.queryStations().then( netList => {
  let stationList = Array.from(seisplotjs.stationxml.allStations(netList));
  let table = document.querySelector("sp-station-table");
  table.stationList = stationList;
  console.log(`got ${stationList.length} stations ${table.stationList.length}`)

});
