import * as sp from 'seisplotjs';
import {Duration, DateTime} from 'luxon';

export interface CellSOH {
  station: string;
  time: DateTime;
  byterate: number;
  rssi: number;
  rsrq: number;
  rsrp: number;
  boardTemprature: number;
  netChannel: number;
  cellularBytesSent: number;
  cellularBytesRecvd: number;
  sinr: number;
  powerIn: number;
}

export function loadStats(stationList: Array<string>, start: DateTime, end: DateTime): Promise<Array<CellSOH>> {
  const net = "CO";
  const loc = "SH";
  const chan = "CEL";
  const one_hour = Duration.fromObject({hours: 1});
  let root = "http://eeyore.seis.sc.edu/scsn";
  let pattern = "jsonl/%n/%s/%Y/%j/%n.%s.%l.%c.%Y.%j.%H.jsonl";
  let msArchive = new sp.mseedarchive.MSeedArchive(root, pattern);
  let promiseList = [];
  for(const sta of stationList) {
    console.log(`get for ${sta}`)
    let time = start;
    while (time <= end) {
      let basePattern = msArchive.fillBasePattern(net, sta, loc, chan);
      let url = msArchive.rootUrl + "/" + msArchive.fillTimePattern(basePattern, time);
      promiseList.push(sp.util.doFetchWithTimeout(url).then(resp => {
        if (resp.ok) {
          return resp.text();
        } else {
          return "";
        }
      }).then(jsonText => {
        const jsonLines = jsonText.trim().split('\n');
        //console.log(`jsonl: ${jsonLines.length}  first: "${jsonLines[0]}"`)
        const out = [];
        jsonLines.forEach( line => {
          if (line.length > 2) {
            let statObj = json_fix_types(JSON.parse(line));
            out.push(statObj);
          }
        });
        return out;
      }));
      time = time.plus(one_hour);
    }
  }
  return Promise.all(promiseList).then(listOfList => {
    let all = [];
    for (let l of listOfList) {
      all = all.concat(l);
    }
    return all;
  }).then(allStats => {
    return preprocess_stats(allStats);
  }).then(allStats => {
    allStats.slice(0,5).forEach(stat => {
      console.log(`stat: ${stat.station} ${stat.byterate} ${stat.cellularBytesSent} ${stat.cellularBytesRecvd}`);
      console.log(`    ${JSON.stringify(stat)}`);
    });
    return allStats;
  });
}

export const mib_floats = ['sinr', 'powerIn', ];
export const mib_ints = ['rssi',
                          'rsrq',
                          'rsrp',
                          'boardTemprature',
                          'netChannel',
                          'cellularBytesSent',
                          'cellularBytesRecvd',
                        ];

export function json_fix_types(json: Object): CellSOH {
  const out = {
    station: json['station'] as string,
    time: sp.util.isoToDateTime(json['time'] as string),
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
    boardTemprature: parseInt(json['boardTemprature']),
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
    // console.log(`bytes:   ${stat['cellularBytesSent']-prev['cellularBytesSent']}`)
    // console.log(`seconds: ${stat['time'].diff(prev['time']).toMillis()/1000}`)
    // console.log(`rate: ${stat['byterate']}`)
    prevMap.set(stat.station, stat);
  }
  return sortStats;
}
