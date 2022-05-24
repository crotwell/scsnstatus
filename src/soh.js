import * as seisplotjs from './seisplotjs_3.0.0-alpha.0.mjs';
import {loadStats} from './jsonl_loader.js';

export function grab() {
  let station = "TEST";
  let start = seisplotjs.luxon.DateTime.fromISO("2022-05-10");
  let end = start.plus(seisplotjs.luxon.Duration.fromObj({hours: 1}));
  let allStats = loadStats(station, start, end);
  for (let stat of allStats) {
    console.log(`${station}: ${stat['SIERRA-MIB::powerIn.0']}`)
  }
}

grab();
