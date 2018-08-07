import Route from '@ember/routing/route';

export default Route.extend({
  model: function(params) {
    let parentModel = this.modelFor('stations.show.cellstatus');
    return {
      start: parentModel.start,
      end: parentModel.end,
      days: parentModel.days,
      station: parentModel.station,
      stationList: parentModel.stationList,
      cellstatus: parentModel.cellstatus,
      destination: params.destination ? params.destination : 'eeyore'
    };
  },
  actions: {
    changeStationOnRoute(station_id) {
      const routeName = this.routeName;
      const routeA = routeName.split('.');
      let destination = this.model.destination;
      if ( ! destination) {
        destination = 'eeyore';
        this.model.destination = destination;
      }
        console.log(routeName+" route changeStation destination.js: "+station_id+" dest:"+this.model.destination);
        console.log("routeA: "+routeA);
      return this.transitionTo('stations.show.cellstatus.latency.destination',
                                station_id,
                                destination,
                                { "queryParams": {
                                  "end": moment(this.model.end).format("YYYY-MM-DD"),
                                  "days": this.model.days }});
    }
  }
});
