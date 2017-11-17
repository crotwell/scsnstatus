import Route from '@ember/routing/route';
import RSVP from 'rsvp';

export default Route.extend({
  model: function(params) {
    return this.store.findRecord('station', params.station_id);
  },
  afterModel: function(model, transition) {
    let out = RSVP.hash({
      channelHash: model.get('channels')
    });
    return out.then(hash => {
      console.log("afterModel RSVP hash "+model.get('channels'));
        console.log("afterModel RSVP hash "+model.get('channels').get('length'));
      return hash;
    });
  }
});
