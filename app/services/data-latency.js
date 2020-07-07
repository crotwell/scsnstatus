import Service from '@ember/service';
import { A } from '@ember/array';
import { tracked } from '@glimmer/tracking';
import RSVP from 'rsvp';
import EmberObject from '@ember/object';

import moment from 'moment';
import {d3, seismogram, seismographconfig, seismograph, ringserverweb} from 'seisplotjs';

const DEFAULT_UPDATE_INTERVAL=moment.duration(10, 'seconds');

class LatencyData {
  @tracked latestData = A([]);
  @tracked accessTime = moment.utc('2000-01-01 00:00:00');
  @tracked pattern = '';
  @tracked networkCode = '';
  @tracked updateInterval = DEFAULT_UPDATE_INTERVAL;
  get updateIntervalSeconds() {
    return this.updateInterval.asSeconds();
  }
}

const HOST_LIST = [ 'eeyore', 'thecloud', 'rtserve'];

const HISTORY_LENGTH = 6+1;

export default class DataLatencyService extends Service {
  networkCode = 'CO';
  @tracked latencyCache = new LatencyData();
  @tracked previousLatencyCache = new LatencyData();
  latencyHistory = A([]);
  updateInterval = DEFAULT_UPDATE_INTERVAL;
  inProgress = false;

  get latencyData() {
    return this.latencyCache;
  }
  queryLatency() {
    if (this.inProgress) {
      return RSVP.hash(this.latencyCache);
    }
    const now = moment.utc();
    if (now.diff(this.latencyCache.accessTime) < this.updateInterval.asMilliseconds()) {
      return RSVP.hash(this.latencyCache);
    }
    this.inProgress = true;
    const networkCode = this.networkCode;
    const eeyore_host = "eeyore.seis.sc.edu";
    const cloud_host = "thecloud.seis.sc.edu";

    const pattern = `^${networkCode}.*_H.Z.*`;
    const irisStats = this.createStreamStats(ringserverweb.IRIS_HOST, 80, pattern);
    const eeyoreStats = this.createStreamStats(eeyore_host, 6382, pattern);
    const cloudStats = this.createStreamStats(cloud_host, 6382, pattern);
    const accessTime = moment.utc();
    const mythis = this;
    return RSVP.all([irisStats, eeyoreStats, cloudStats]).then(statArray => {
      mythis.inProgress = false;
      let lc = new LatencyData();
      lc.latestData = this.cosolidateStats(statArray);
      lc.accessTime = accessTime;
      lc.pattern = pattern;
      lc.networkCode = networkCode;
      lc.updateInterval = this.updateInterval;
      mythis.latencyHistory.unshift(lc);
      mythis.latencyCache = lc;
      if (mythis.latencyHistory.length > HISTORY_LENGTH) {
        mythis.previousLatencyCache = mythis.latencyHistory.pop();
      } else if (mythis.latencyHistory.length > 1) {
        mythis.previousLatencyCache = mythis.latencyHistory[mythis.latencyHistory.length-1];
      }
      let plc = mythis.previousLatencyCache;
      /*
      const plc = mythis.previousLatencyCache;
      const lc = mythis.latencyCache;
      plc.latestData = lc.latestData;
      plc.accessTime = lc.accessTime;
      plc.pattern = lc.pattern;
      plc.networkCode = lc.networkCode;
      plc.updateInterval = lc.updateInterval;
      lc.latestData = this.cosolidateStats(statArray);
      lc.accessTime = accessTime;
      lc.pattern = pattern;
      lc.networkCode = networkCode;
      lc.updateInterval = this.updateInterval;
      */
      this.calcLatencyAcceleration(plc, lc);
      return lc;
    }, reason => {
      console.error(`queryLatency Failed: ${reason}`);
      mythis.inProgress = false;
      return mythis.latencyCache;
    });
  }
  cosolidateStats(hostStats) {
    const out = new Map();
    for (const hs of hostStats) {
      for (const s of hs.stats) {
        if (! out.has(s.key)) {
          out.set(s.key, {});
          out.get(s.key)['key'] = s.key;
        }
        const x = out.get(s.key);
        x[hs.host] = s;
        s['accessTime'] = hs.accessTime;
      }
    }
    return A(Array.from(out.values()));
  }
  createStreamStats(host, port, pattern) {
    const shortHost = host.split('.')[0];
    const conn = new ringserverweb.RingserverConnection(host, port);
    return conn.pullStreams(pattern).then(streamStats => {
      const stationStats = ringserverweb.stationsFromStreams(streamStats.streams);
      return {
        'host': shortHost,
        'fullhost': host,
        'pattern': pattern,
        'accessTime': streamStats.accessTime,
        'stats': stationStats
      };
    });
  }
  calcLatencyAcceleration(previousLatencyCache, latencyCache) {
    for (let stat of latencyCache.latestData) {
      stat.acceleration = {};
      for (let prevStat of previousLatencyCache.latestData) {
        if (stat.key === prevStat.key) {
          for (let host of HOST_LIST) {
            stat.acceleration[host] = (stat[host].end.diff(prevStat[host].end)) /
                                      (stat[host].accessTime.diff(prevStat[host].accessTime));
          }
        }
      }
    }
  }
}
