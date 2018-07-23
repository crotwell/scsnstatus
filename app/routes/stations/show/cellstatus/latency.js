import Route from '@ember/routing/route';
import moment from 'moment';

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
      const routeName = this.get('routeName');
      const routeA = routeName.split('.');
        console.log(routeName+" route changeStation latency.js: "+station_id+" dest:"+this.get('model').destination);
        console.log("routeA: "+routeA);
      return this.transitionTo('stations.show.cellstatus.latency',
                                station_id,
                                { "queryParams": {
                                  "end": moment(this.get('model').end).format("YYYY-MM-DD"),
                                  "days": this.get('model').days }});
    },
    xxxgoDestinationOnRoute( dest ) {
      console.log("cellstatus route goDest("+dest+") "+this.controller.get('dest')+"->"+dest);
      this.controller.set('dest', dest);
    },
    goDestinationOnRoute(dest, station_id) {
      console.log("goDestinationOnRoute goDest("+dest+") ");
      // maybe don't need this???
      return this.transitionTo('stations.show.cellstatus.latency',
                                station_id,
                                { queryParams: {
                                  "end": moment(this.controller.get('model').end).format("YYYY-MM-DD"),
                                  "days": this.controller.get('model').days,
                                  "destination": dest }});
    }
  }
});
