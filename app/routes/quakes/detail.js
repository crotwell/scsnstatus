import Route from '@ember/routing/route';
import RSVP from 'rsvp';
import { inject as service } from '@ember/service';
import seisplotjs from 'ember-seisplotjs';

export default Route.extend({
  mseedArchive: service(),
  model: function(params) {
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
        let staCodes = hash.stationList.filter(s => s.activeAt(hash.quake.time)).map( s => s.stationCode).join();
        let chanList = this.store.query('channel', {
          networkCode: appModel.networkCode,
          stationCode: staCodes,
          chanCode: "HH?,HN?",
        });return RSVP.hash({
          quake: hash.quake,
          stationList: hash.stationList,
          center: {
            lat: 33.75,
            lon: -81,
          },
          chanList: chanList,
          _mag: hash._mag,
        });
      }).then(hash => {
        console.log(`found ${hash.chanList.length} channels`);

        let channelMap = new Map();
        hash.chanList.forEach(c => { channelMap.set(c.codes, c);});
        hash.channelMap = channelMap;
        hash.seismogramMap = this.loadSeismograms(hash.chanList, hash.quake);
        return RSVP.hash(hash);
      });
  },
  loadSeismograms(chanList, quake) {
    console.log(`loadSeismograms found ${chanList.length} channels ${Array.isArray(chanList)}`);
    let shortChanList = chanList.filter((c, index, self) => c.activeAt(quake.time) && c.channelCode.endsWith('Z'));
    console.log(`loadSeismograms shortChanList ${shortChanList.length} channels ${Array.isArray(shortChanList)}`);

    if (quake.time.isAfter(moment.utc('2016-06-01T00:00:00Z'))) {
      return this.loadSeismogramsEeyore(shortChanList, quake);
    } else {
      return this.loadSeismogramsIRIS(shortChanList, quake);
    }
  },
  loadSeismogramsIRIS(chanList, quake) {
    let query = new seisplotjs.fdsndataselect.DataSelectQuery();
    let endTime = moment.utc(quake.time).add(180, 'seconds');
    let chanTimeList = chanList.map(c => {
      return {
        channel: {
          station: {
            stationCode: c.get('station').get('stationCode'),
            network: {
              networkCode: c.get('station').get('network').get('networkCode'),
            },
          },
          locationCode: c.get('locationCode'),
          channelCode: c.get('channelCode')
        },
        startTime: quake.time,
        endTime: endTime,
      };
    });
    return query.postQuerySeismograms(chanTimeList);
  },
  loadSeismogramsEeyore(chanList, quake) {
      let seismogramMap = new Map();
      let pArray = [];
      shortChanList.forEach(c => {
        console.log(`try ${c.codes}`);
        if (c.activeAt(quake.time) && c.channelCode.endsWith('Z')) {
          let promise = this.mseedArchive.load(c, quake.time, moment.utc(quake.time).add(180, 'seconds'))
            .then(seisMap => {
              console.log(`retrieve ${c.codes}  found ${seisMap.size} in map`);
              if (seisMap.get(c.codes).length > 0) {
                seismogramMap.set(c.codes, seisMap.get(c.codes));
                console.log(`create seisMap ${Array.isArray(seisMap.get(c.codes))}`);
              }
            }).catch(e => {
              console.log("error getting data: "+e);
            });
          console.log(`promise is ${promise}`);
          pArray.push(promise);
        } else {
          console.log(`skipping ${c.codes}`);
        }
      });
      console.log(`pArray has ${pArray.length} promises`);
      return RSVP.all(pArray)
      .then(pA => {
        console.log(`ONLY LOAD FEW!!!! loadSeismograms found ${seismogramMap.size} seismograms pA: ${pA.length}`);
      }).then(() => seismogramMap);
  },
});
