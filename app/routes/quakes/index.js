import Route from '@ember/routing/route';
import RSVP from 'rsvp';

export default Route.extend({
  model: function(params) {
    let appModel = this.modelFor('application');
    return RSVP.hash({
      stationList: this.store.query('station',
                                    { networkCode: appModel.networkCode,
                                      endAfter: moment.utc()}),
      quakeList: this.store.query('quake', {
        minLat: 32,
        maxLat: 35,
        minLon: -84,
        maxLon: -78,
        startTime: '2009-06-01T00:00:00',
        format: 'xml',
      }),
      center: {
        lat: 33.75,
        lon: -81
      },

    });
  },
  afterModel: function(model) {
    return RSVP.hash({
      stationList: model.stationList,
      quakeList: model.quakeList,
      center: model.center,
      magList: RSVP.all(model.quakeList.map( q => q.prefMagnitude)),
    })
  },
});
