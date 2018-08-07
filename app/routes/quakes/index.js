import Route from '@ember/routing/route';
import RSVP from 'rsvp';

export default Route.extend({
  model: function(params) {
    return RSVP.hash({
      quakes: [], //this.store.query('quakes', {})
      center: {
        lat: 35,
        lon: -81
      },

    });
  },
});
