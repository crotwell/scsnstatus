import Service from '@ember/service';
import { A } from '@ember/array';
import { tracked } from '@glimmer/tracking';
import RSVP from 'rsvp';
import EmberObject from '@ember/object';
import hostToShortName  from '../utils/host-to-short-name';

import moment from 'moment';
import {
  d3,
  seismogram,
  seismographconfig,
  seismograph,
  ringserverweb
} from 'seisplotjs';

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

class StatsFailures {
  @tracked eeyore;
  @tracked iris;
  @tracked cloud;
  constructor() {
    this.eeyore = 0;
    this.iris = 0;
    this.cloud = 0;
  }
}

const eeyore_host = "eeyore.seis.sc.edu";
const cloud_host = "li1043-95.members.linode.com";
const cloud_cname_host = "thecloud.seis.sc.edu";

const HOST_LIST = [ 'eeyore', 'cloud', 'iris'];

const DEFAULT_HISTORY_LENGTH = 12;

export default class DataLatencyService extends Service {
  @tracked networkCode = 'CO';
  @tracked latencyCache = new LatencyData();
  @tracked previousLatencyCache = null;
  @tracked historyLength = DEFAULT_HISTORY_LENGTH;
  latencyHistory = A([]);
  @tracked updateInterval = DEFAULT_UPDATE_INTERVAL;
  inProgress = false;
  @tracked statsFailures = new StatsFailures();


  isConnectionFailure(host) {
    console.log(`isConnectionFailure  ${host}`);
    return ! this.statsFailures[host] || this.statsFailures[shortHost] > 0;
  }

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

    const pattern = `^${networkCode}.*_H.Z.*`;
    const irisStats = this.createStreamStats(ringserverweb.IRIS_HOST, 80, pattern);
    const eeyoreStats = this.createStreamStats(eeyore_host, 6382, pattern);
    const cloudStats = this.createStreamStats(cloud_host, 6382, pattern);
    const accessTime = moment.utc();
    const mythis = this;
    return RSVP.all([irisStats, eeyoreStats, cloudStats]).then(statArray => {
      let lc = new LatencyData();
      lc.latestData = this.cosolidateStats(statArray, mythis.latencyCache);
      lc.accessTime = accessTime;
      lc.pattern = pattern;
      lc.networkCode = networkCode;
      lc.updateInterval = this.updateInterval;
      mythis.latencyCache = lc;
      mythis.inProgress = false;
      // clean up any too old latency results
      while (mythis.latencyHistory.length > 0
              && accessTime.diff(mythis.latencyHistory[0].accessTime) > (1+mythis.historyLength)*mythis.updateInterval.asMilliseconds()) {
        mythis.latencyHistory.pop();
      }
      mythis.latencyHistory.unshift(lc);
      if (mythis.latencyHistory.length > mythis.historyLength) {
        mythis.previousLatencyCache = mythis.latencyHistory.pop();
      } else if (mythis.latencyHistory.length > 1) {
        mythis.previousLatencyCache = mythis.latencyHistory[mythis.latencyHistory.length-1];
      }
      let plc = mythis.previousLatencyCache;
      this.calcLatencyVelocity(plc, lc);
      return lc;
    }, reason => {
      console.error(`queryLatency Failed: ${reason}`);
      mythis.inProgress = false;
      return mythis.latencyCache;
    });
  }
  cosolidateStats(hostStats, prevLC) {
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
    if (prevLC && prevLC.latestData) {
      // if current doesn't have station or station-host, use prev value
      for (let pvalue of prevLC.latestData) {
        const pkey = pvalue['key'];
        if ( out.has(pkey)) {
          for (let host of HOST_LIST) {
            if (! out.get(pkey)[host] && pvalue[host]) {
              out.get(pkey)[host] = pvalue[host];
            }
          }
        } else {
          // didn't find, reuse
          const clonePValue = new ringserverweb.StreamStat(pvalue.key, pvalue.startRaw, pvalue.endRaw);
          clonePValue.accessTime = moment.utc();
          out.set(pkey, clonePValue);
        }
      }
    }
    return A(Array.from(out.values()));
  }
  createStreamStats(host, port, pattern) {
    const mythis = this;
    const shortHost = hostToShortName(host);
    const conn = new ringserverweb.RingserverConnection(host, port);
    conn.timeout(this.updateInterval.asSeconds()/2);
    const out = {
      'host': shortHost,
      'fullhost': host,
      'pattern': pattern,
      'accessTime': moment.utc(),
      'stats': []
    };
    return conn.pullStreams(pattern).then(streamStats => {
      mythis.statsFailures[shortHost] = 0;
      const stationStats = ringserverweb.stationsFromStreams(streamStats.streams);
      out.stats = stationStats;
      return out;
    }, reason => {
      // connection failure, return with empty stats
      mythis.statsFailures[shortHost] += 1;
console.log(`statsFailure ${shortHost} ${mythis.statsFailures[shortHost]}`)
      return out;
    });
  }
  calcLatencyVelocity(previousLatencyCache, latencyCache) {
    for (let stat of latencyCache.latestData) {
      stat.velocity = {};
      for (let host of HOST_LIST) {
        stat.velocity[host] = 0; // just in case we don't find the stream at all
      }
      if (previousLatencyCache) {
        for (let prevStat of previousLatencyCache.latestData) {
          if (stat.key === prevStat.key) {
            for (let host of HOST_LIST) {
              if (stat[host] && prevStat[host]) {
                stat.velocity[host] = (stat[host].end.diff(prevStat[host].end)) /
                                          (stat[host].accessTime.diff(prevStat[host].accessTime));
                if (stat.velocity[host] < 0) {
                  console.log(`negative velocity: (${stat[host].end} .diff(${prevStat[host].end})) /
                                            (${stat[host].accessTime}.diff(${prevStat[host].accessTime})`)
                }
              }
            }
          }
        }
      }
    }
  }
}
