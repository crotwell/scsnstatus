
import * as sp from 'seisplotjs';
import hostToShortName  from './host-to-short-name';

import {DateTime, Duration} from 'luxon';
import {
  ringserverweb
} from 'seisplotjs';

const DEFAULT_UPDATE_INTERVAL= Duration.fromObject({seconds: 10});

export class LatencyData {
  latestData: Array<sp.ringserverweb.StreamStat> = [];
  accessTime: DateTime;
  pattern: string;
  networkCode: string;
  updateInterval: Duration;
  constructor() {
    this.latestData = [];
    this.accessTime = DateTime.fromISO('2000-01-01T00:00:00', {zone: 'utc'});
    this.pattern = '';
    this.networkCode = '';
    this.updateInterval = DEFAULT_UPDATE_INTERVAL;
  }
  get updateIntervalSeconds() {
    return this.updateInterval.as('seconds');
  }
}

export class StatsFailures {
  hostToFails = new Map<string, number>();
  constructor() {
  }
  numForHost(host: string) {
    if (this.hostToFails.has(host)) { return this.hostToFails.get(host);}
    return 9999;
  }
  zero(host: string) {
    this.hostToFails.set(host, 0);
  }
  addOne(host: string) {
    let prev = 0;
    if (host in this.hostToFails.keys()) {
      const x = this.hostToFails.get(host);
      prev = (x!=null)?x:0;
    }
    this.hostToFails.set(host, 1+prev);
  }
}

export const eeyore_host = "https://eeyore.seis.sc.edu/ringserver/";
export const cloud_host = "https://thecloud.seis.sc.edu/ringserver/";
//export const cloud_host = "http://139-144-31-38.ip.linodeusercontent.com/ringserver";
export const cloud_cname_host = "thecloud.seis.sc.edu";

export const HOST_LIST = [ 'eeyore', 'cloud', 'iris'];

export const DEFAULT_HISTORY_LENGTH = 12;

export class HostStreamStats {
  host: string;
  fullhost: string;
  pattern: string;
  accessTime: DateTime;
  stats: Array<sp.ringserverweb.StreamStat>;
  constructor(host: string, fullhost: string, pattern: string, accessTime: DateTime) {
    this.host = host;
    this.fullhost = fullhost;
    this.pattern = pattern;
    this.accessTime = accessTime;
    this.stats = [];
  }
}

export class DataLatencyService {
  networkCode = 'CO';
  latencyCache = new LatencyData();
  previousLatencyCache: LatencyData|null = null;
  historyLength = DEFAULT_HISTORY_LENGTH;
  latencyHistory: Array<LatencyData> = [];
  updateInterval = DEFAULT_UPDATE_INTERVAL;
  inProgress = false;
  statsFailures = new StatsFailures();


  isConnectionFailure(host: string) {
    return this.statsFailures.numForHost(host) !== 0;
  }

  get latencyData() {
    return this.latencyCache;
  }
  queryLatency() {
    if (this.inProgress) {
      return Promise.all(this.latencyCache.latestData).then(() => this.latencyCache );
    }
    const now = DateTime.utc();
    if (now.diff(this.latencyCache.accessTime).toMillis() < this.updateInterval.toMillis()) {
      return Promise.all(this.latencyCache.latestData).then(() => this.latencyCache );
    }
    this.inProgress = true;
    const networkCode = this.networkCode;

    const pattern = `^(FDSN:)?${networkCode}.*_H.Z.*`;
    const irisStats = this.createStreamStats(ringserverweb.IRIS_HOST, pattern);
    const eeyoreStats = this.createStreamStats(eeyore_host, pattern);
    const cloudStats = this.createStreamStats(cloud_host, pattern);
    const accessTime = DateTime.utc();
    const mythis = this;
    return Promise.all([irisStats, eeyoreStats, cloudStats])
    .then((statArray: Array<HostStreamStats>) => {
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
              && accessTime.diff(mythis.latencyHistory[0].accessTime).toMillis() > (1+mythis.historyLength)*mythis.updateInterval.toMillis()) {
        mythis.latencyHistory.pop();
      }
      mythis.latencyHistory.unshift(lc);
      if (mythis.latencyHistory.length > mythis.historyLength) {
        const popped = mythis.latencyHistory.pop();
        mythis.previousLatencyCache = popped?popped:null;
      } else if (mythis.latencyHistory.length > 1) {
        mythis.previousLatencyCache = mythis.latencyHistory[mythis.latencyHistory.length-1];
      }
      let plc = mythis.previousLatencyCache;
      this.calcLatencyVelocity(plc, lc);
      return lc;
    }).catch(reason => {
      console.log(`fail latency: ${reason}`);
      mythis.inProgress = false;
      return mythis.latencyCache;
    });
  }
  cosolidateStats(hostStats: Array<HostStreamStats>, prevLC: LatencyData) {
    const out = new Map();
    for (const hs of hostStats) {
      for (const s of hs.stats) {
        if (! out.has(s.key)) {
          out.set(s.key, {});
          out.get(s.key)['key'] = s.key;
        }
        const x = out.get(s.key);
        x[hs.host] = s;
        s.accessTime = hs.accessTime;
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
        } else if (pvalue.startRaw) {
          // didn't find, reuse
          const clonePValue = new ringserverweb.StreamStat(pvalue.key, pvalue.startRaw, pvalue.endRaw);
          clonePValue.accessTime = DateTime.utc();
          out.set(pkey, clonePValue);
        } else {
          // can happen after long network outage, like sleeping laptop?
          console.log(`previous startRaw is undef, use 1970?`);
          const clonePValue = new ringserverweb.StreamStat(pvalue.key, "1970-01-01T00:00:00Z", "1970-01-01T00:00:00Z");
          clonePValue.accessTime = DateTime.utc();
          out.set(pkey, clonePValue);
        }
      }
    }
    return Array.from(out.values());
  }
  createStreamStats(hosturl: string, pattern: string): Promise<HostStreamStats> {
    const mythis = this;
    const shortHost = hostToShortName(hosturl);
    const conn = new ringserverweb.RingserverConnection(hosturl);
    conn.timeout(this.updateInterval.toMillis()/1000/2);
    const out = {
      'host': shortHost,
      'fullhost': hosturl,
      'pattern': pattern,
      'accessTime': DateTime.utc(),
      'stats': []
    };
    return conn.pullStreams(pattern).then(streamStats => {
      mythis.statsFailures.zero(shortHost);
      const stationStats = ringserverweb.stationsFromStreams(streamStats.streams);
      out.stats = stationStats;
      return out;
    }).catch( reason => {
      // connection failure, return with empty stats
      mythis.statsFailures.addOne(shortHost);
      return out;
    });
  }
  calcLatencyVelocity(previousLatencyCache: LatencyData|null, latencyCache: LatencyData) {
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
              }
            }
          }
        }
      }
    }
  }
}
