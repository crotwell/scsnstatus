import Route from '@ember/routing/route';
import { A } from '@ember/array';
import RSVP from 'rsvp';
import moment from 'moment';
import seisplotjs from 'seisplotjs';
import travelTime from 'ember-seisplotjs/utils/travel-time';
import firstPS from 'ember-seisplotjs/utils/first-p-s';
import {
  convertToSeisplotjs,
  convertQuakeToSPjS
} from 'ember-seisplotjs/utils/convert-to-seisplotjs';


export default class GlobalQuakesQuakeRoute extends Route {

    model(params) {
      let preP = 30;
      let postS = 600;
      if ( ! params.quake_id) {throw new Error("no quake_id in params");}
      let appModel = this.modelFor('application');
      let peekQuake = this.store.peekRecord('quake', params.quake_id);
      return RSVP.hash({
        appModel: appModel,
        quake: peekQuake ? peekQuake : this.store.findRecord('quake', params.quake_id),
        stationList: this.store.findRecord('network', appModel.networkCode)
          .then(net => net.stations),
        }).then(hash => {
          let distaz = seisplotjs.distaz.distaz(hash.appModel.SCCenter.latitude,
            hash.appModel.SCCenter.longitude,
            hash.quake.latitude,
            hash.quake.longitude);
          let chanCodeList = "LH?,LN?,HH?,HN?";
          if (distaz.delta < 5) {
            chanCodeList = "HH?,HN?,LH?,LN?";
          }
          let m = hash.quake.preferredMagnitude.get('mag');
          let activeStations = hash.stationList.filter(s => s.activeAt(hash.quake.time));
          let inactiveStations = hash.stationList.filter(s => ! s.activeAt(hash.quake.time));
          let staCodes = activeStations.map( s => s.stationCode).join();
          let chanList = this.store.query('channel', {
            networkCode: appModel.networkCode,
            stationCode: staCodes,
            locationCode: "00",
            channelCode: chanCodeList,
          });

          let ttList = RSVP.all(activeStations.map( s => travelTime(hash.quake, s, [])));
          let netHash = RSVP.all(hash.stationList.map( s => s.network));
          hash.staTonet = netHash;
          hash.center = hash.appModel.SCCenter;
          hash.chanList = chanList;
          hash.ttList = ttList;
          hash._mag = hash._mag;
          hash._pickList = hash.quake.pickList;
          hash.activeStations = activeStations;
          hash.inactiveStations = inactiveStations;
          return RSVP.hash(hash);
        }).then(hash => {
          let channelMap = new Map();
          hash.chanList.forEach(c => { channelMap.set(c.codes, c);});
          hash.channelMap = channelMap;
          hash.seisDataList = this.createSeismogramsDisplayData(hash.chanList, hash.quake, hash.ttList, preP, postS);
          hash.seismographConfig = new seisplotjs.seismographconfig.SeismographConfig();
          hash.seismographConfig.title = seisplotjs.seismographconfig.DEFAULT_TITLE;
          hash.seismographConfig.linkedAmpScale = new seisplotjs.seismographconfig.LinkedAmpScale();
          hash.seismographConfig.linkedTimeScale = new seisplotjs.seismographconfig.LinkedTimeScale();
          hash.seismographConfig.wheelZoom = false;
          hash.seismographConfig.margin.top = 5;
          hash.seismographConfig.minHeigh = 200;
          return RSVP.hash(hash);
        });
    }
    createSeismogramsDisplayData(shortChanList, quake, ttList, preFirstPhase, postSecondPhase) {
      let originMarker = {
        markertype: 'predicted',
        name: "origin",
        time: seisplotjs.moment.utc(quake.time)
      };
      let sddList = [];
      shortChanList.forEach(c => {
        console.log(`try ${c.codes}  ${c.activeAt(quake.time)}`);
        if (c.activeAt(quake.time) ) {
            let staCode = c.get('station').get('stationCode');
            let netCode = c.get('station').get('network').get('networkCode');
            let ttime = this.getTTime(ttList, staCode, netCode);
            let pAndS = firstPS(ttime);
            let pArrival = pAndS.firstP;
            let sArrival = pAndS.firstS;
            let startEnd = new seisplotjs.util.StartEndDuration(moment.utc(quake.time).add(pArrival.time, 'second').add(-1*preFirstPhase, 'second'),
                                                                moment.utc(quake.time).add(sArrival.time, 'second').add(postSecondPhase, 'second'));
            const convertChannel = convertToSeisplotjs(c.get('station').get('network'), c.get('station'), c);
            let sdd = seisplotjs.seismogram.SeismogramDisplayData.fromChannelAndTimeWindow(convertChannel, startEnd);
            sdd.addQuake(convertQuakeToSPjS(quake));
            sdd.addTravelTimes(ttime.traveltime);
            let phaseMarkers = seisplotjs.seismograph.createMarkersForTravelTimes(quake, ttime.traveltime);
            phaseMarkers.push(originMarker);
            sdd.addMarkers(phaseMarkers);
            sddList.push(sdd);
        } else {
          console.log(`skipping ${c.codes}`);
        }
      });
      return sddList;
    }
    loadSeismograms(chanList, quake, ttList, preP, postS) {
      let shortChanList = chanList;
      //let shortChanList = chanList.filter((c, index, self) => c.activeAt(quake.time) && c.channelCode.endsWith('Z'));
      //shortChanList = shortChanList.slice(0, 1); // testing just one

      if (quake.time.isAfter(moment.utc('2019-06-01T00:00:00Z'))) {
        return this.loadSeismogramsEeyore(shortChanList, quake, ttList, preP, postS);
      } else {
        return this.loadSeismogramsIRIS(shortChanList, quake, ttList, preP, postS);
      }
    }
    loadSeismogramsIRIS(shortChanList, quake, ttList, preP, postS) {
      let query = new seisplotjs.fdsndataselect.DataSelectQuery();
      let chanTimeList = shortChanList.map(c => {
        let staCode = c.get('station').get('stationCode');
        let netCode = c.get('station').get('network').get('networkCode');
        let ttime = this.getTTime(ttList, staCode, netCode);
        let pAndS = firstPS(ttime);
        let pArrival = pAndS.firstP;
        let sArrival = pAndS.firstS;
        let startEnd = new seisplotjs.util.StartEndDuration(moment.utc(quake.time).add(pArrival.time, 'second').add(-1*preP, 'second'),
                                                            moment.utc(quake.time).add(sArrival.time, 'second').add(postS, 'second'));
        const convertChannel = convertToSeisplotjs(c.get('station').get('network'), c.get('station'), c);
        let sdd = new seisplotjs.seismogram.SeismogramDisplayData.fromChannelAndTimeWindow(convertChannel, startEnd);
        sdd.addQuake(convertQuakeToSPjS(quake));
        let phaseMarkers = seisplotjs.seismograph.createMarkersForTravelTimes(quake, ttime.traveltime);
        phaseMarkers.push({
          markertype: 'predicted',
          name: "origin",
          time: seisplotjs.moment.utc(quakeList[0].time)
        });
        sdd.addMarkers(phaseMarkers)
        return sdd;
      });
      return query.postQuerySeismograms(chanTimeList);
    }
    loadSeismogramsEeyore(shortChanList, quake, ttList, preP, postS) {
        let pArray = [];
        let chanTR = [];
        shortChanList.forEach(c => {
          if (c.activeAt(quake.time) && c.channelCode.endsWith('Z')) {

              let staCode = c.get('station').get('stationCode');
              let netCode = c.get('station').get('network').get('networkCode');
              let ttime = this.getTTime(ttList, staCode, netCode);
              let pAndS = firstPS(ttime);
              let pArrival = pAndS.firstP;
              let sArrival = pAndS.firstS;
              let startEnd = new seisplotjs.util.StartEndDuration(moment.utc(quake.time).add(pArrival.time, 'second').add(-1*preP, 'second'),
                                                                  moment.utc(quake.time).add(sArrival.time, 'second').add(postS, 'second'));
              const convertChannel = convertToSeisplotjs(c.get('station').get('network'), c.get('station'), c);
              let sdd = seisplotjs.seismogram.SeismogramDisplayData.fromChannelAndTimeWindow(convertChannel, startEnd);
              sdd.addQuake(convertQuakeToSPjS(quake));
              let phaseMarkers = seisplotjs.seismograph.createMarkersForTravelTimes(quake, ttime.traveltime);
              phaseMarkers.push({
                markertype: 'predicted',
                name: "origin",
                time: seisplotjs.moment.utc(quake.time)
              });
              sdd.addMarkers(phaseMarkers)
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

        let mseedArchive = new seisplotjs.mseedarchive.MSeedArchive(baseUrl, pattern);
        return mseedArchive;
    }
    mseedArchive = this.createMSeedArchive();
}
