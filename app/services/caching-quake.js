import Service from '@ember/service';
import { inject as service } from '@ember/service';
import RSVP from 'rsvp';
import seisplotjs from 'seisplotjs';

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
  oldLocalEnd = moment.utc('2021-10-30T00:00:00');
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
    let loadingPromise = this.loadOldLocal();
    if (this.cache.updateTime === null || moment.utc().subtract(this.updateInterval).isAfter(this.cache.updateTime)) {
      loadingPromise.then(oldLocal => {
        console.log(`oldLocal len: ${oldLocal} `);
        return RSVP.hash({
          oldLocal: oldLocal,
          recentLocal: this.store.query('quake', this.createLocalQueryParams(this.oldLocalEnd, end))
        });
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
      loadingPromise = RSVP.all( this.cache.local );
    }
    return loadingPromise;
  }

  load(start, end) {
    let loadingPromise;
    if ( ! seisplotjs.util.isDef(end)) {end = moment.utc();}
    if ( ! seisplotjs.util.isDef(start)) {start = moment.utc(end).subtract(this.lagDays, 'days');}
    if (start.isBefore(this.cache.cacheStart) || end.isAfter(moment.utc(this.cache.cacheEnd).add(this.updateInterval))) {
console.log(`Reload due to start/end: cache: ${this.cache.cacheStart}/${this.cache.cacheEnd}  load: ${start}/${end}`)
console.log(`start ${start.isBefore(this.cache.cacheStart)}`)
console.log(`end: ${end.isAfter(moment.utc(this.cache.cacheEnd).add(this.updateInterval))}`)
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
    console.log(`_internalLoad ${start.toISOString()}  ${end.toISOString()}`)
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
      console.log(`_internalLoad(start, end) gl: ${hash.globalQuakeList.length}  re: ${hash.regionalQuakeList.length}`);
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
    let loadingPromise;
    if (this.cache.oldLocal === null || this.cache.oldLocal.length === 0) {
      loadingPromise = this.store.query('quake', this.createLocalQueryParams(this.netStart, this.oldLocalEnd))
      .then(oldLocal => {
        that.cache.oldLocal = oldLocal;
        return oldLocal;
      });
    } else {
      loadingPromise = RSVP.resolve( this.cache.oldLocal );
    }
    return loadingPromise;
  }
}
