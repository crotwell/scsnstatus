import * as sp from 'seisplotjs';
import {Duration, DateTime, Interval} from 'luxon';

export const DEFAULT_HOST = "eeyore.seis.sc.edu"
//export const DEFAULT_HOST = "thecloud.seis.sc.edu"
export interface DataSOHType {
  station: string;
  time: DateTime;
}

export interface CellSOH extends DataSOHType {
  [index: string]: string|number|DateTime;
  byterate: number;
  rssi: number;
  rsrq: number;
  rsrp: number;
  boardTemperature: number;
  netChannel: number;
  cellularBytesSent: number;
  cellularBytesRecvd: number;
  sinr: number;
  powerIn: number;
}

export interface PercentCharge {
    id: string,
    name: string,
    address: string,
    percentCharge: number,
    [index: string]: string|number
}
export interface KilovaultSOC extends DataSOHType {
  [index: string]: string|number|DateTime|Array<{[index: string]: string|number}>;
  soc: Array<PercentCharge>;
}

export interface LatencyVoltage extends DataSOHType {
  volt: number,
  eeyore: number,
  thecloud: number,
  iris: number
}

export interface DiskUsage {
  free: number,
  used: number,
  total: number,
  percentused: number,
  human: string,
  hostname: string,
  path: string
}

export interface ComputerStat extends DataSOHType {
  temp: number,
  du: Array<DiskUsage>
}

export function loadCellStats(stationList: Array<string>, interval: Interval): Promise<Array<CellSOH>> {
  const chan = "CEL";
  const sidChan = "W_CEL_";
  return Promise.all([loadStats(stationList, chan, interval),
        loadStats(stationList, sidChan, interval)])
    .then(plist => {
      let out = []
      for (const p of plist) {
        out = out.concat(p);
      }
      return out;
    })
    .then(jsonTextList => {
      console.log(`got ${jsonTextList.length} json objs`)
      const allStats = jsonTextList.filter(line => line.length > 2).map(line => {
            let statObj = json_fix_types(JSON.parse(line));
            return statObj;
      });
      return preprocess_stats(allStats.filter(x=> !!x));
    });
}
export function loadKilovaultStats(stationList: Array<string>, interval: Interval): Promise<Array<KilovaultSOC>> {
  const chan = "KVSOC";
  const sidChan = "W_KV_SOC";
  return Promise.all([loadStats(stationList, chan, interval),
        loadStats(stationList, sidChan, interval)])
    .then(plist => {
      let out = []
      for (const p of plist) {
        out = out.concat(p);
      }
      return out;
    })
    .then(jsonTextList => {
      const allStats = jsonTextList.filter(line => line.length > 2).map(line => {
            let statJson = JSON.parse(line);
            if ('station' in statJson === false) { throw new Error("No station in json object");}
            if ('time' in statJson === false) { throw new Error("No time in json object");}
            statJson.time = sp.util.isoToDateTime(statJson['time'] as string);
            statJson.soc.forEach( (s: any) => {
              s.percentCharge = parseFloat(s.percentCharge);
            });
            return statJson as KilovaultSOC;
      });
      return allStats.filter(x=> !!x);
    });
}

export function loadComputerStat(stationList: Array<string>, interval: Interval): Promise<Array<ComputerStat>> {
  const chan = "DISK";
  const sidChan = "W_DSK_";
  return Promise.all([loadStats(stationList, chan, interval),
        loadStats(stationList, sidChan, interval)])
    .then(plist => {
      let out = []
      for (const p of plist) {
        out = out.concat(p);
      }
      return out;
    })
    .then(jsonTextList => {
      console.log(`got ${jsonTextList.length} json objs`)
      const allStats = jsonTextList.filter(line => line.length > 2).map(line => {
        let statJson = JSON.parse(line);
        if ('station' in statJson === false) { throw new Error("No station in json object");}
        if ('time' in statJson === false) { throw new Error("No time in json object");}
        statJson.time = sp.util.isoToDateTime(statJson['time'] as string);
        statJson.temp = parseFloat(statJson['temp'] as string);
        statJson.du.forEach( (s: any) => {
          s.free = parseFloat(s.free);
          s.used = parseFloat(s.used);
          s.total = parseFloat(s.total);
          s.percentused = parseFloat(s.percentused);
        });
        return statJson as ComputerStat;
      });
      return allStats.filter(x=> !!x);
    });
}

export function loadStats(stationList: Array<string>, chan: string, interval: Interval, host=DEFAULT_HOST): Promise<Array<string>> {
  const net = "CO";
  const loc = "SH";
  const one_hour = Duration.fromObject({hours: 1});
  const protocol = sp.util.checkProtocol();
  let root = `${protocol}//${host}/scsn`;
  let pattern = "jsonl/%n/%s/%Y/%j/%n.%s.%l.%c.%Y.%j.%H.jsonl";
  let msArchive = new sp.mseedarchive.MSeedArchive(root, pattern);
  let promiseList = [];
  for(const sta of stationList) {
    let time = interval.start;
    while (time <= interval.end) {
      let basePattern = msArchive.fillBasePattern(net, sta, loc, chan);
      let url = msArchive.rootUrl + "/" + msArchive.fillTimePattern(basePattern, time);
      promiseList.push(sp.util.doFetchWithTimeout(url).then(resp => {
        if (resp.ok) {
          return resp.text();
        } else {
          return "";
        }
      }).catch(err => {
        // no data?
        return "";
      }));
      time = time.plus(one_hour);
    }
  }
  return Promise.all(promiseList).then((listOfList: Array<string>) => {
    let all: Array<string> = [];
    for (let s of listOfList) {
      for (let l of s.trim().split('\n')) {
        if (l.length > 0) {
          all.push(l);
        }
      }
    }
    return all;
  }).then(allStats => {
    return allStats;
  });
}

export const mib_floats = [
  'sinr',
  'powerIn',
  'byterate',
];
export const mib_ints = [
  'rssi',
  'rsrq',
  'rsrp',
  'boardTemperature',
  'netChannel',
  'cellularBytesSent',
  'cellularBytesRecvd',
];
export const mib_strings = [
  'networkServiceType',
  'cellid',
  'cellBand',
  'networkState'
];

export function json_fix_types(json: any): CellSOH {
  if ('station' in json === false) { throw new Error("No station in json object");}
  if ('time' in json === false) { throw new Error("No time in json object");}
  const station = json['station'] as string;
  const time = sp.util.isoToDateTime(json['time'] as string);
  const out = {
    station: station,
    time: time,
    networkServiceType: json['networkServiceType'] as string,
    cellBand: json['cellBand'] as string,
    networkState: json['networkState'] as string,
    cellid: json['cellid'] as string,
    byterate: 0,
    sinr: parseFloat(json['sinr']),
    powerIn: parseFloat(json['powerIn']),
    rssi: parseInt(json['rssi']),
    rsrq: parseInt(json['rsrq']),
    rsrp: parseInt(json['rsrp']),
    boardTemperature: parseInt(json['boardTemprature']), // mispell in mib
    netChannel: parseInt(json['netChannel']),
    cellularBytesSent: parseInt(json['cellularBytesSent']),
    cellularBytesRecvd: parseInt(json['cellularBytesRecvd']),
  };
  return out;
}

export function preprocess_stats(allStats: Array<CellSOH>) {
  let prevMap = new Map();
  let sortStats = allStats.slice().sort((a, b) => b.time.toMillis() - a.time.toMillis());
  for (const stat of sortStats) {
    const prev = prevMap.get(stat.station);
    if (prev) {
      stat.byterate = (stat.cellularBytesSent - prev.cellularBytesSent)/
        (stat.time.diff(prev.time).toMillis()/1000 );
      if (stat.byterate < 0) {stat.byterate = 0;}
    } else {
      stat.byterate = 0;
    }
    prevMap.set(stat.station, stat);
  }
  return sortStats;
}
