import Route from '@ember/routing/route';

export default Route.extend({
  model: function(params) {
    return this.modelFor('stations.show.cellstatus');
  },
  actions: {
    changeStationOnRoute(station_id) {
      const routeName = this.routeName;
      const routeA = routeName.split('.');
        console.log(routeName+" route changeStation rssi.js "+station_id);
      return this.transitionTo('stations.show.cellstatus.rssi',
                                station_id,
                                { "queryParams": {
                                   "end": moment(this.model.end).format("YYYY-MM-DD"),
                                   "days": this.model.days }});
    }
  }
});
