import Service from '@ember/service';
import { inject as service } from '@ember/service';
import RSVP from 'rsvp';
import seisplotjs from 'seisplotjs';
import dataHost from '../utils/data-host';
import FdsnEventSerializer from 'ember-seisplotjs/serializers/fdsnevent';

export default class CachingQuakeService extends Service {
  @service store;
  cache = {
    global: [],
    regional: [],
    local: [],
    oldLocal: [],
    cacheStart: moment.utc(),
    cacheEnd: moment.utc(),
    updateTime: moment.utc('2000-01-01T00:00:00')
  };
  updateInterval = moment.duration(5, "minutes");
  lagDays = 30;
  netStart = moment.utc('2009-06-01T00:00:00');
  oldLocalEnd = moment.utc('2021-11-30T00:00:00');
  historicalUrl = "/scsn/sc_quakes/sc_quakes.xml";
  appModel = {
    networkCode: 'CO',
    SCBoxArea: {
      minLat: 31.75,
      maxLat: 35.5,
      minLon: -84,
      maxLon: -78
    },
    SCCenter: {
      latitude: 33.75,
      longitude: -81,
    },
    startTime: '2009-06-01T00:00:00',
    quakeQueryParams: {
      global: {
        minMag: 6
      },
      regional: {

      },
      local: {

      }
    }
  };
  loadLocal() {
    const that = this;
    const end = moment.utc();
    return this.loadOldLocal().then(oldLocal => {
      if (this.cache.updateTime === null || moment.utc().subtract(this.updateInterval).isAfter(this.cache.updateTime)) {
        let latestQuake = oldLocal.reduce((prev, curr) => {return (prev && prev.time.isAfter(curr.time)) ? prev : curr });
        let latest = moment.utc(latestQuake.time).add(1, 'second');
        return RSVP.hash({
          oldLocal: oldLocal,
          recentLocal: this.store.query('quake', this.createLocalQueryParams(latest, end))
        }).then(hash => {
          const out = Ember.A();
          hash.oldLocal.forEach(q => out.push(q));
          hash.recentLocal.forEach(q => out.push(q));
          return out;
        }).then(locals => {
          that.cache.local = locals;
          return locals;
        });
      } else {
        return RSVP.resolve( this.cache.local );
      }
    });
  }

  load(start, end) {
    let loadingPromise;
    if ( ! seisplotjs.util.isDef(end)) {end = moment.utc();}
    if ( ! seisplotjs.util.isDef(start)) {start = moment.utc(end).subtract(this.lagDays, 'days');}
    if (start.isBefore(this.cache.cacheStart) || end.isAfter(moment.utc(this.cache.cacheEnd).add(this.updateInterval))) {
      this.cache.updateTime = null; // force load
    }
    if (this.cache.updateTime === null || moment.utc().subtract(this.updateInterval).isAfter(this.cache.updateTime)) {
      loadingPromise = this._internalLoad(start, end);
    } else {
      loadingPromise = RSVP.hash({
        globalQuakeList: this.cache.global,
        regionalQuakeList: this.cache.regional,
        localQuakeList: this.cache.local
      });
    }
    return loadingPromise.then(hash => {
      return {
        globalQuakeList: this.cache.global.filter(q => q.time.isAfter(start) && q.time.isBefore(end)),
        regionalQuakeList: this.cache.regional.filter(q => q.time.isAfter(start) && q.time.isBefore(end)),
        localQuakeList: this.cache.local.filter(q => q.time.isAfter(start) && q.time.isBefore(end))
      };
    });
  }
  _internalLoad(start, end) {
    const that = this;
    let hash = {
      globalQueryParams: this.createGlobalQueryParams(start, end),
      regionQueryParams: this.createRegionalQueryParams(start, end),
      localQueryParams: this.createLocalQueryParams(start, end)
    };
    return RSVP.hash(hash).then(hash => {
      hash.globalQuakeList = this.store.query('quake', hash.globalQueryParams);
      hash.regionalQuakeList = this.store.query('quake', hash.regionQueryParams);
      hash.localQuakeList = this.loadLocal();
      return RSVP.hash(hash);
    }).then(hash => {
      that.cache.updateTime = moment.utc();
      that.cache.cacheStart = start;
      that.cache.cacheEnd = end;
      that.cache.global = hash.globalQuakeList;
      that.cache.regional = hash.regionalQuakeList;
      that.cache.local = hash.localQuakeList;
      return RSVP.hash(hash);
    });
  }
  createGlobalQueryParams(start, end) {
    return {
      minMag: this.appModel.quakeQueryParams.global.minMag,
      startTime: start,
      endTime: end,
      format: 'xml',
    };
  }
  createRegionalQueryParams(start, end) {
    return {
      latitude: this.appModel.SCCenter.latitude,
      longitude: this.appModel.SCCenter.longitude,
      maxRadius: 10,
      minMag: 4.5,
      startTime: start,
      endTime: end,
      format: 'xml',
    };
  }
  createLocalQueryParams(start, end) {
    return {
      minLat: this.appModel.SCBoxArea.minLat,
      maxLat: this.appModel.SCBoxArea.maxLat,
      minLon: this.appModel.SCBoxArea.minLon,
      maxLon: this.appModel.SCBoxArea.maxLon,
      startTime: start,
      endTime: end,
      format: 'xml',
    };
  }

  loadOldLocal() {
    const that = this;
    const data_host = dataHost();
    let loadingPromise;
    if (this.cache.oldLocal === null || this.cache.oldLocal.length === 0) {
//      let historicalUrl = this.historicalUrl.replace('eeyore.seis.sc.edu', dataHost());
      let historicalUrl = `http://${dataHost()}${this.historicalUrl}`;

      loadingPromise = seisplotjs.util.doFetchWithTimeout(historicalUrl)
      .then(response => {
          if (response.status === 200) {
            return response.text();
          } else {
            throw new Error(`Status not successful: ${response.status}`);
          }
      }).then(function(rawXmlText) {
        return new DOMParser().parseFromString(rawXmlText, seisplotjs.util.XML_MIME);
      }).then(function(rawXml) {
        // local quakeml file on datahost is from USGS, so need to use
        // USGS as host to correctly parse eventid
        // see https://github.com/FDSN/fdsnws-event/issues/3
        return seisplotjs.quakeml.parseQuakeML(rawXml, seisplotjs.quakeml.USGS_HOST);
      }).then(function(quake_array) {
        let fdsnEventSerializer = new FdsnEventSerializer();
        let cacheoldLocal = [];
        for (let q of quake_array) {
          let norm_q = fdsnEventSerializer.normalizeQuake(q);
          let store_q = that.store.push(norm_q);
          cacheoldLocal.push(store_q);
        }
        that.cache.oldLocal = cacheoldLocal;
        return that.cache.oldLocal;
      });
    } else {
      loadingPromise = RSVP.resolve( this.cache.oldLocal );
    }
    return loadingPromise;
  }
}
