import Route from '@ember/routing/route';
import RSVP from 'rsvp';
import seisplotjs from 'ember-seisplotjs';
import { run } from '@ember/runloop';

const networkCode = 'CO';
const ringserver_host = 'eeyore.seis.sc.edu';
const ringserver_port = 6382;

export default Route.extend({
  updateInterval: 10000,
  queryLatency: function() {
    return this.store.query('stream-status',
         {host: ringserver_host,
          port: ringserver_port,
          match: '^'+networkCode+'_.*'
        });
  },
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
    },


  setupController: function(controller, model){
    this._super(controller, model); // do the default implementation since I'm overriding this func
    this.startRefreshing();
  },
  startRefreshing: function(){
    this.set('refreshing', true);
    console.log("### startRefreshing");
    run.later(this, this.refresh, this.updateInterval);
  },
  refresh: function(){
    console.log("latency refresh");
    if(!this.refreshing)
      return;
    this.queryLatency().then( x => {console.log("### query " +x);});
    run.later(this, this.refresh, this.updateInterval);
  },
  actions:{
    willTransition: function(){
      this.set('refreshing', false);
    },
    changeStation(station) {
      console.log("/index route changeStation"+station);
      this.transitionTo('stations/show',  station);
    }
  }
});
