import Route from '@ember/routing/route';
import RSVP from 'rsvp';

export default Route.extend({
    model: function(params) {
let x = this.paramsFor('stations.show');
console.log("x  "+x);
        let { station_id } = this.paramsFor('stations.show');
        console.log("station id : "+station_id);
        let { station, stationList } = this.modelFor('stations.show');
        console.log("station : "+station);


      //let station = this.store.findRecord('station', params.station_id);
      return this.store.findRecord('network', 'CO')
      .then(function(network) {
        return RSVP.hash({
          'network': network,
          "stationList": stationList,
          'station': station,
          'start': null,
        });
      });
    },
    afterModel: function(model, transition) {
      let out = RSVP.hash({
        nHash: model.network,
        slHash: model.stationList,
        channelHash: model.station.get('channels'),
        networkHash: model.station.get('network'),
        netStaHash: RSVP.all(model.network.get('stations').getEach('stationCode'))
      });
      return out;
    },
    actions: {
      changeStationOnRoute(station_id) {
        const routeName = this.routeName;
        const routeA = routeName.split('.');
          console.log(routeName+" route changeStation "+station_id);
        return this.transitionTo(routeName, station_id);
      }
    }
});
