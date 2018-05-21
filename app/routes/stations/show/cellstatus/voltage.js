import Route from '@ember/routing/route';

export default Route.extend({
  model: function(params) {
    return this.modelFor('stations.show.cellstatus');
  },
  actions: {
    changeStationOnRoute(station_id) {
      const routeName = this.get('routeName');
      const routeA = routeName.split('.');
        console.log(routeName+" route changeStation B"+station_id);
      return this.transitionTo('stations.show.cellstatus.voltage',
                                station_id,
                                { "queryParams": {
                                   "end": moment(this.get('model').end).format("YYYY-MM-DD"),
                                   "days": this.get('model').days }});
    }
  }
});
