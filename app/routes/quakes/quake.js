import Route from '@ember/routing/route';
import { A } from '@ember/array';
import RSVP from 'rsvp';
import moment from 'moment';
import seisplotjs from 'seisplotjs';
import travelTime from 'ember-seisplotjs/utils/travel-time';
import firstPS from 'ember-seisplotjs/utils/first-p-s';
import convertToSeisplotjs from 'ember-seisplotjs/utils/convert-to-seisplotjs';

export default class QuakesQuakeRoute extends Route {
  model(params) {
    let preOrigin = 30;
    let postOrigin = 270;
    if ( ! params.quake_id) {throw new Error("no quake_id in params");}
    let appModel = this.modelFor('application');
    return RSVP.hash({
      appModel: appModel,
      center: appModel.SCCenter,
      quakeQueryBox: [ { lat: appModel.SCBoxArea.minLat, lng: appModel.SCBoxArea.minLon},
                       { lat: appModel.SCBoxArea.maxLat, lng: appModel.SCBoxArea.minLon},
                       { lat: appModel.SCBoxArea.maxLat, lng: appModel.SCBoxArea.maxLon},
                       { lat: appModel.SCBoxArea.minLat, lng: appModel.SCBoxArea.maxLon},
      ],
      quake: this.store.findRecord('quake', params.quake_id),
      stationList: this.store.findRecord('network', appModel.networkCode)
        .then(net => net.stations),
      }).then(hash => {
        let m = hash.quake.preferredMagnitude.get('mag');
        console.log(`m  ${m}`);
        // console.log(`magnitude: ${hash.quake.preferredMagnitude.mag} ${hash.quake.preferredMagnitude}  ${hash.quake.preferredMagnitude.id}`);
        console.log(`hash.quake lat/lon ${hash.quake.latitude} ${hash.quake.longitude}`);
        let activeStations = hash.stationList.filter(s => s.activeAt(hash.quake.time));
        let inactiveStations = hash.stationList.filter(s => ! s.activeAt(hash.quake.time));
        let staCodes = activeStations.map( s => s.stationCode).join();
        let chanList = this.store.query('channel', {
          networkCode: appModel.networkCode,
          stationCode: staCodes,
          locationCode: "00",
          channelCode: "HHZ,HNZ",
        });

        let ttList = RSVP.all(activeStations.map( s => travelTime(hash.quake, s, [])));
        let netHash = RSVP.all(hash.stationList.map( s => s.network));
        hash.staTonet = netHash;
        hash.chanList = chanList;
        hash.ttList = ttList;
        hash._mag = hash._mag;
        hash._pickList = hash.quake.pickList;
        hash.activeStations = activeStations;
        hash.inactiveStations = inactiveStations;
        return RSVP.hash(hash);
      }).then(hash => {
        console.log(`found ${hash.chanList.length} channels`);
        console.log(`quake has ${hash.quake.pickList.length} picks`);
        let channelMap = new Map();
        hash.chanList.forEach(c => { channelMap.set(c.codes, c);});
        hash.channelMap = channelMap;
        hash.chanTRList = this.loadSeismograms(hash.chanList, hash.quake, hash.ttList, preOrigin, postOrigin);
        return RSVP.hash(hash);
      });
  }
  loadSeismograms(chanList, quake, ttList, preOrigin, postOrigin) {
    console.log(`loadSeismograms found ${chanList.length} channels ${Array.isArray(chanList)}`);
    let shortChanList = chanList;
    //let shortChanList = chanList.filter((c, index, self) => c.activeAt(quake.time) && c.channelCode.endsWith('Z'));
    //shortChanList = shortChanList.slice(0, 1); // testing just one
    console.log(`loadSeismograms shortChanList ${shortChanList.length} channels ${Array.isArray(shortChanList)}`);

    if (quake.time.isAfter(moment.utc('2019-06-01T00:00:00Z'))) {
      return this.loadSeismogramsEeyore(shortChanList, quake, ttList, preOrigin, postOrigin);
    } else {
      return this.loadSeismogramsIRIS(shortChanList, quake, ttList, preOrigin, postOrigin);
    }
  }
  loadSeismogramsIRIS(shortChanList, quake, ttList, preOrigin, postOrigin) {
    let query = new seisplotjs.fdsndataselect.DataSelectQuery();
    let chanTimeList = shortChanList.map(c => {
      let staCode = c.get('station').get('stationCode');
      let netCode = c.get('station').get('network').get('networkCode');
      let ttime = this.getTTime(ttList, staCode, netCode);
      let pAndS = firstPS(ttime);
      let pArrival = pAndS.firstP;
      let sArrival = pAndS.firstS;
      let startEnd = new seisplotjs.util.StartEndDuration(moment.utc(quake.time).add(-1*preOrigin, 'second'),
                                                          moment.utc(quake.time).add(postOrigin, 'second'));
      const convertChannel = convertToSeisplotjs(c.get('station').get('network'), c.get('station'), c);
      let sdd = new seisplotjs.seismogram.SeismogramDisplayData.fromChannelAndTimeWindow(convertChannel, startEnd);
      return sdd;
    });
    return query.postQuerySeismograms(chanTimeList);
  }
  loadSeismogramsEeyore(shortChanList, quake, ttList, preOrigin, postOrigin) {
      let pArray = [];
      let chanTR = [];
      shortChanList.forEach(c => {
        console.log(`try ${c.codes}`);
        if (c.activeAt(quake.time) && c.channelCode.endsWith('Z')) {

            let staCode = c.get('station').get('stationCode');
            let netCode = c.get('station').get('network').get('networkCode');
            let ttime = this.getTTime(ttList, staCode, netCode);
            let pAndS = firstPS(ttime);
            let pArrival = pAndS.firstP;
            let sArrival = pAndS.firstS;
            let startEnd = new seisplotjs.util.StartEndDuration(moment.utc(quake.time).add(-1*preOrigin, 'second'),
                                                                moment.utc(quake.time).add(postOrigin, 'second'));
            const convertChannel = convertToSeisplotjs(c.get('station').get('network'), c.get('station'), c);
            let sdd = seisplotjs.seismogram.SeismogramDisplayData.fromChannelAndTimeWindow(convertChannel, startEnd);
            chanTR.push(sdd);
        } else {
          console.log(`skipping ${c.codes}`);
        }
      });
      return this.mseedArchive.loadSeismograms(chanTR);
  }
  getTTime(ttList, staCode, netCode) {
    for(let t of ttList) {
      if (t.station.get('stationCode') === staCode
          && t.station.network.get('networkCode') === netCode) {
        return t;
      }
    }
  }

  createMSeedArchive() {
      let host = 'eeyore.seis.sc.edu';
      let port = 80; //6383
      let protocol = 'http:';
      if ("https:" == document.location.protocol) {
        protocol = 'https:'
      }

      let portStr = "";
      if (port != 80) {
        portStr = ":"+port;
      }
      let baseUrl = protocol+"//"+host+portStr+'/mseed';
      let pattern = "%n/%s/%Y/%j/%n.%s.%l.%c.%Y.%j.%H";

      console.log("baseUrl: "+baseUrl);
      let mseedArchive = new seisplotjs.mseedarchive.MSeedArchive(baseUrl, pattern);
      return mseedArchive;
  }
  mseedArchive = this.createMSeedArchive();
}
