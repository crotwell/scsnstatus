import Service from '@ember/service';
import { A } from '@ember/array';
import { tracked } from '@glimmer/tracking';
import RSVP from 'rsvp';
import EmberObject from '@ember/object';

import moment from 'moment';
import {d3, seismogram, seismographconfig, seismograph, ringserverweb} from 'seisplotjs';

class LatencyData {
  @tracked latestData = A([]);
  @tracked accessTime = moment.utc('2000-01-01 00:00:00');
  @tracked pattern = '';
  @tracked networkCode = '';
  @tracked updateInterval = 0;
}

export default class DataLatencyService extends Service {
  networkCode = 'CO';
  @tracked latencyCache = new LatencyData();
  updateInterval = 10;
  inProgress = false;

  get latencyData() {
    return this.latencyCache;
  }
  queryLatency() {
    if (this.inProgress) {
      return RSVP.hash(this.latencyCache);
    }
    this.inProgress = true;
    const now = moment.utc();
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
      const lc = mythis.latencyCache;
      lc.latestData = this.cosolidateStats(statArray);
      lc.accessTime = accessTime;
      lc.pattern = pattern;
      lc.networkCode = networkCode;
      lc.updateInterval = this.updateInterval;
      return lc;
    }).then(hash => {
      mythis.inProgress = false;
      console.log(`queryLatency finished ${this.latencyCache.latestData.length}`);
      return hash;
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
      }
    }
    return A(Array.from(out.values()));
  }
  createStreamStats(host, port, pattern) {
    const shortHost = host.split('.')[0];
    const conn = new ringserverweb.RingserverConnection(host, port);
    return conn.pullStreams(pattern).then(streamStats => {
      streamStats = ringserverweb.stationsFromStreams(streamStats.streams);
      return {
        'host': shortHost,
        'fullhost': host,
        'pattern': pattern,
        'accessTime': streamStats.accessTime,
        'stats': streamStats
      };
    });
  }
}
