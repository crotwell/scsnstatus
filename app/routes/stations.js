import Route from '@ember/routing/route';
import RSVP from 'rsvp';

const networkCode = 'CO';
const ringserver_host = 'eeyore.seis.sc.edu';
const ringserver_port = 6382;

export default Route.extend({

    model: function(params) {
      return RSVP.hash({
        network: this.store.findRecord('network', networkCode),
        latency: this.queryLatency(networkCode),
        center: {
          latitude: 33.75,
          longitude: -81,
        },
      }).then(function(hash) {
        hash.stationList = hash.network.get('stations');
        return RSVP.hash(hash);
      });
    },
    afterModel: function(model, transition) {
      console.log("station.index afterModel");
      model.activeStations = model.stationList.filter(s => s.activeAt());
      model.inactiveStations = model.stationList.filter(s => ! s.activeAt());
      let out = RSVP.hash({
        stationHash: model.network.get('stations'),

      });
      return out.then(hash => {
        console.log("afterModel RSVP hash "+model.network.get('stations'));
          console.log("afterModel RSVP hash "+model.network.get('stations').get('length'));
        return hash;
      });
    },
    queryLatency: function(networkCode) {
      return this.store.query('stream-status',
           {host: ringserver_host,
            port: ringserver_port,
            match: '^'+networkCode+'_.*'
          });
    },
    actions: {
      changeStation(station) {
        console.log("stations route changeStation"+station);
        this.transitionTo('stations/show',  station);
      }
    }
});
