import Route from '@ember/routing/route';

export default Route.extend({
  model: function(params) {
    return this.store.findRecord('channel', params.channel_id);
  },
  actions: {
    changeStationOnRoute(station_id) {
      const routeName = this.routeName;
      let routeA = routeName.split('.');
      // can't use full route as need to pick a channel, so go up one level
      routeA.pop();
      const toRoute = routeA.join('.');
        console.log(routeName+" route changeStation "+station_id);
      return this.transitionTo(toRoute, station_id);
    }
  }
});
