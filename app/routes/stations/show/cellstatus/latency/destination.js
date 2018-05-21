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
      destination: params.destination
    };
  },
});
