import Route from '@ember/routing/route';
import RSVP from 'rsvp';


export default Route.extend({
  model: function(params) {
    return RSVP.hash({
      networkCode: 'CO',
    });
  },
});
