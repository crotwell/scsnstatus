import Route from '@ember/routing/route';
import RSVP from 'rsvp';

export default Route.extend({
  model: function(params) {
    return RSVP.hash({
      stationList: [],
      quakeList: this.store.query('quake', {
        minLat: 32,
        maxLat: 35,
        minLon: -83,
        maxLon: -79,
        startTime: '2009-06-01T00:00:00',
        format: 'xml',
      }),
      center: {
        lat: 34,
        lon: -81
      },

    });
  },
});
