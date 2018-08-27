import Route from '@ember/routing/route';
import RSVP from 'rsvp';

export default Route.extend({
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
        hash.center = {
          lat: hash.quake.latitude,
          lon: hash.quake.longitude,
        };
        hash._mag = hash.quake.prefMagnitude;
        return RSVP.hash({
          quake: hash.quake,
          stationList: hash.stationList,
          center: hash.center,
          _mag: hash._mag,
        });
      }).then(hash => {
        if (hash._mag) {
        console.log(`hash mag ${hash._mag.get('mag')}`);
      } else {
        console.log(`hash mag not defined......`);
      }
        return hash;
      });
  },
});
