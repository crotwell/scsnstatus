import Route from '@ember/routing/route';
import RSVP from 'rsvp';
import { inject as service } from '@ember/service';
import seisplotjs from 'ember-seisplotjs';
import travelTime from 'ember-seisplotjs/utils/travel-time';

export default Route.extend({
  mseedArchive: service(),
  model: function(params) {
    let preP = 300;
    let postS = 1800;
    if ( ! params.quake_id) {throw new Error("no quake_id in params");}
    let appModel = this.modelFor('application');
    return RSVP.hash({
      quake: this.store.findRecord('quake', params.quake_id),
      stationList: this.store.findRecord('network', appModel.networkCode)
        .then(net => net.stations),
      }).then(hash => {
        let m = hash.quake.prefMagnitude.get('mag');
        console.log(`m  ${m}`);
        // console.log(`magnitude: ${hash.quake.prefMagnitude.mag} ${hash.quake.prefMagnitude}  ${hash.quake.prefMagnitude.id}`);
        console.log(`hash.quake lat/lon ${hash.quake.latitude} ${hash.quake.longitude}`);
        let activeStations = hash.stationList.filter(s => s.activeAt(hash.quake.time));
        let inactiveStations = hash.stationList.filter(s => ! s.activeAt(hash.quake.time));
        let staCodes = activeStations.map( s => s.stationCode).join();
        let chanList = this.store.query('channel', {
          networkCode: appModel.networkCode,
          stationCode: staCodes,
          locationCode: "00",
          channelCode: "HHZ,LHZ",
        });

        // empty phaseList means default of [ 'p', 'P', 's', 'S', 'PKP', 'PKP', 'PKIKP', 'SKS']
        let ttList = RSVP.all(activeStations.map( s => travelTime(hash.quake, s, [])));
        return RSVP.hash({
          quake: hash.quake,
          stationList: hash.stationList,
          center: {
            latitude: 33.75,
            longitude: -81,
          },
          chanList: chanList,
          ttList: ttList,
          _mag: hash._mag,
          _pickList: hash.quake.pickList,
          activeStations: activeStations,
          inactiveStations: inactiveStations,
        });
      }).then(hash => {
        console.log(`found ${hash.chanList.length} channels`);
        console.log(`quake has ${hash.quake.pickList.length} picks`);
        let channelMap = new Map();
        hash.chanList.forEach(c => { channelMap.set(c.codes, c);});
        hash.channelMap = channelMap;
        //hash.arrivals = ttList.map( tt => moment.utc(hash.quake.time).add())
        hash.seismogramMap = this.loadSeismograms(hash.chanList, hash.quake, hash.ttList, preP, postS);
        return RSVP.hash(hash);
      });
  },
  loadSeismograms(chanList, quake, ttList, preP, postS) {
    console.log(`loadSeismograms found ${chanList.length} channels ${Array.isArray(chanList)}`);
    let shortChanList = chanList;
    //let shortChanList = chanList.filter((c, index, self) => c.activeAt(quake.time) && c.channelCode.endsWith('Z'));
    //shortChanList = shortChanList.slice(0, 1); // testing just one
    console.log(`loadSeismograms shortChanList ${shortChanList.length} channels ${Array.isArray(shortChanList)}`);

    if (quake.time.isAfter(moment.utc('2019-06-01T00:00:00Z'))) {
      return this.loadSeismogramsEeyore(shortChanList, quake, ttList, preP, postS);
    } else {
      return this.loadSeismogramsIRIS(shortChanList, quake, ttList, preP, postS);
    }
  },
  loadSeismogramsIRIS(shortChanList, quake, ttList, preP, postS) {
    let query = new seisplotjs.fdsndataselect.DataSelectQuery();
    let endTime = moment.utc(quake.time).add(180, 'seconds');
    let chanTimeList = shortChanList.map(c => {
      let staCode = c.get('station').get('stationCode');
      let netCode = c.get('station').get('network').get('networkCode');
      let ttime = this.getTTime(ttList, staCode, netCode);
      let pArrival = ttime.traveltime.arrivals.reduce( (acc, cur) => {
        if (cur.phase.startsWith('P') || cur.phase.startsWith('p')) {
          if ( ! acc) {
            return cur;
          } else if (cur.time < acc.time) {
            return cur;
          } else {
            return acc;
          }
        }
        return acc;
      });
      let sArrival = ttime.traveltime.arrivals.reduce( (acc, cur) => {
        if (cur.phase.startsWith('P') || cur.phase.startsWith('p')) {
          if ( ! acc) {
            return cur;
          } else if (cur.time < acc.time) {
            return cur;
          } else {
            return acc;
          }
        }
        return acc;
      });
      return {
        // dumb to avoid Ember proxy needing get style property access
        channel: {
          station: {
            stationCode: staCode,
            network: {
              networkCode: netCode,
            },
          },
          locationCode: c.get('locationCode'),
          channelCode: c.get('channelCode')
        },
        startTime: moment.utc(quake.time).add(pArrival.time, 'second').add(-1*preP, 'second'),
        endTime: moment.utc(quake.time).add(sArrival.time, 'second').add(postS, 'second'),
      };
    });
    return query.postQuerySeismograms(chanTimeList);
  },
  loadSeismogramsEeyore(shortChanList, quake) {
      let pArray = [];
      let chanTR = [];
      shortChanList.forEach(c => {
        console.log(`try ${c.codes}`);
        if (c.activeAt(quake.time) && c.channelCode.endsWith('Z')) {
          chanTR.push({
            channel: c,
            startTime: quake.time,
            endTime: seisplotjs.moment.utc(quake.time).add(180, 'seconds')
          });
        } else {
          console.log(`skipping ${c.codes}`);
        }
      });
      return this.mseedArchive.loadTraces(chanTR);
  },
  calcArrivals(ttList, quake, staCode, netCode) {

  },
  getTTime(ttList, staCode, netCode) {
    for(let t of ttList) {
      if (t.station.get('stationCode') === staCode
          && t.station.network.get('networkCode') === netCode) {
        return t;
      }
    }
  }
});
