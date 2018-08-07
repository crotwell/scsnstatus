import Route from '@ember/routing/route';
import RSVP from 'rsvp';

export default Route.extend({
  model: function(params) {
    let { station, stationList } = this.modelFor('stations.show');
      return RSVP.hash({
        'network': station.get('network'),
        "stationList": stationList,
        'station': station,
        'channelList': station.get('channels'),
      });
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
