import Route from '@ember/routing/route';
import RSVP from 'rsvp';

export default Route.extend({
  model: function(params) {
    if ( ! params.station_id) {throw new Error("no station_id in params");}
    let stationsModel = this.modelFor('stations');
    console.log("route stations.show sM: "+stationsModel);
    let  stationList  = stationsModel.stationList;
    console.log("route stations.show "+stationList);
    return RSVP.hash({
      'station': this.store.findRecord('station', params.station_id),
      'stationList': stationList
    });
  },
  afterModel: function(model, transition) {
    let out = RSVP.hash({
      channelHash: model.station.get('channels'),
      networkHash: model.station.get('network')
    });
  },
  queryLatency: function(networkCode, stationCode) {
    return this.store.query('stream-status',
         {host: ringserver_host,
          port: ringserver_port,
          match: '^'+networkCode+'_'+stationCode+'_.*'
        });
  },
  actions: {
    changeStationOnRoute(station_id) {
      const routeName = this.get('routeName');
      const routeA = routeName.split('.');
        console.log(routeName+" route changeStation show.js"+station_id);
        console.log("routeName: "+routeName);
        console.log("routeA: "+routeA);
      return this.transitionTo('stations.show', station_id);
    }
  }
});
