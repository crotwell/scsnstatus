import Route from '@ember/routing/route';

export default Route.extend({
  model: function(params) {
    return this.store.findRecord('network', 'CO');
  },
  afterModel: function(model, transition) {
    console.log("helicorders afterModel");
      console.log("helicorders afterModel "+model.get('stations'));
    let out = Ember.RSVP.hash({
      stationHash: model.get('stations')
    });
    return out.then(hash => {
      console.log("afterModel RSVP hash "+model.get('stations'));
        console.log("afterModel RSVP hash "+model.get('stations').get('length'));
      return hash;
    });
  }

});
