import { Duration } from 'luxon';
import {createNavigation} from './navbar';
import './style.css';
import * as sp from 'seisplotjs';
import {Interval} from 'luxon';

createNavigation();

const app = document.querySelector<HTMLDivElement>('#app')!

app.innerHTML = `
  <h5 id="nowtime">Now! And again! ${sp.version}</h5>
  <div>
    <sp-timerange duration="P30DT0M"></sp-timerange>
    <button id="loadMonth">Month</button>
    <button id="loadYear">Year</button>
    <button id="loadAll">All</button>
  </div>
  <div class="plot">
  <h3>Earthquakes:</h3>
  <sp-station-quake-map></sp-station-quake-map>
  <sp-quake-table></sp-quake-table>
  </div>
  <div class="quakes"></div>
  <div class="datakeys"></div>
  <div><pre class="raw"></pre></div>
  <a href="https://vitejs.dev/guide/features.html" target="_blank">Documentation</a>
`;

const SC_QUAKE_URL = "https://eeyore.seis.sc.edu/scsn/sc_quakes/sc_quakes.xml"

let allQuakes = [];

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

const quakeQuery = sp.quakeml.fetchQuakeML(SC_QUAKE_URL)
.then( qml => {
  allQuakes = qml.eventList;
  const trEl = document.querySelector("sp-timerange");
  displayForTime(trEl.getTimeRange(), allQuakes);
  console.log(`got ${qml.eventList.length} quakes ${table.quakeList.length}`)

});
