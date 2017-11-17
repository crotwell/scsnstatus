import Route from '@ember/routing/route';
import RSVP from 'rsvp';
import seisplotjs from 'ember-seisplotjs';

const networkCode = 'CO';
const ringserver_host = 'eeyore.seis.sc.edu';
const ringserver_port = 6382;

export default Route.extend({
  model: function(params) {
    return RSVP.hash({
      network: this.store.findRecord('network', networkCode),
      latency: this.store.query('stream-status',
       {host: ringserver_host,
        port: ringserver_port,
        match: '^'+networkCode+'_.*'
      })
    });
  },
    afterModel: function(model, transition) {
      console.log("station.index afterModel");
      let out = RSVP.hash({
        stationHash: model.network.get('stations')
      });
      return out.then(hash => {
        console.log("afterModel RSVP hash "+model.network.get('stations'));
          console.log("afterModel RSVP hash "+model.network.get('stations').get('length'));
        return hash;
      });
    }
});
