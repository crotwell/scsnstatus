import Service from '@ember/service';
import { A } from '@ember/array';
import { tracked } from '@glimmer/tracking';
import RSVP from 'rsvp';
import EmberObject from '@ember/object';
import dataHost from '../utils/data-host';
import moment from 'moment';

import {
  d3,
  seismogram,
  seismographconfig,
  seismograph,
  util
} from 'seisplotjs';

export default class CellStatusService extends Service {

  relativeURL = '/scsn/cell-stats/';
  baseURL = 'http://eeyore.seis.sc.edu'+this.relativeURL;
  cache = [];
  maxCacheLength = 100;


  queryCellStatus(station, year, dayofyear) {
    const mythis = this;
    const today = moment.utc();
    if (year !== today.year() || dayofyear !== today.dayOfYear()) {
      // only look in cache if not "today" so we get updates
      // careful of int vs string with ===
      const yearStr = ""+year;
      const dayofyearStr = ""+dayofyear;
      let cachedValue = this.cache.find( cellStat => {
        return cellStat.dayofyear === dayofyearStr
          && cellStat.station === station && cellStat.year === yearStr;
      });
      if (cachedValue) {
        return new RSVP.Promise(function(resolve, reject) {
          resolve(cachedValue);
        });
      }
    }
    let url = `http://${dataHost()}${this.relativeURL}${year}/${dayofyear}/${station}.json`;
    return util.doFetchWithTimeout(url, null, 10)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Response status: ${response.status}`);
        }
        return response.json();
      }).then(json => {
        if (year !== today.year() || dayofyear !== today.dayOfYear()) {
          // only push non-today
          mythis.cache.push(json);
        }
        while (mythis.cache.length > mythis.maxCacheLength) {
          mythis.cache.shift();
        }
        return json;
      }, function(error){
        console.log(error);
        console.log("...returning valid but empty value.")
        return mythis.emptyCellStatus(station, year, dayofyear);
      });

  }

  emptyCellStatus(station, year, dayofyear) {
    return {
      "station": station,
      "dayofyear": dayofyear,
      "values": [],
      "year": year
    };
  }
}
