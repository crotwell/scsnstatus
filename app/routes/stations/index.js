import Route from '@ember/routing/route';
import { action } from "@ember/object";
import { inject as service } from '@ember/service';
import RSVP from 'rsvp';

export default class StationsIndexRoute extends Route {
  @service dataLatency;
  model(params) {
    return RSVP.hash(this.modelFor('stations'));
  }
  afterModel() {
    return this.dataLatency.queryLatency();
  }

  setupController(controller, model) {
    console.log("### setupController StationsIndexRoute");
    super.setupController(controller, model);
    controller.startRefreshing();
  }
  @action updateLatency() {
    console.log(`StationsIndexRoute  @action updateLatency()`);
    return this.dataLatency.queryLatency();
  }
}
