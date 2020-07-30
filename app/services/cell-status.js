import Service from '@ember/service';
import { A } from '@ember/array';
import { tracked } from '@glimmer/tracking';
import RSVP from 'rsvp';
import EmberObject from '@ember/object';

import moment from 'moment';
import {
  d3,
  seismogram,
  seismographconfig,
  seismograph,
  util
} from 'seisplotjs';

export default class CellStatusService extends Service {

  baseURL = 'http://eeyore.seis.sc.edu/earthworm/cell-stats/';

  queryCellStatus(station, year, jday) {
    const mythis = this;
    let url = `${this.baseURL}/${year}/${jday}/${station}.json`;
    return util.doFetchWithTimeout(url, null, 10)
    .then(out => {
        console.log(`queryCellStatus got ${out}`);
        return out.json();
      }, function(error){
        console.log(error);
        console.log("...returning valid but empty value.")
        return mythis.emptyCellStatus(station, year, jday);
      });

  }

  emptyCellStatus(station, year, jday) {
    return {
      "station": station,
      "dayofyear": jday,
      "values": [],
      "year": year
    };
  }
}
