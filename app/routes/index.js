import Route from '@ember/routing/route';
import { A, isArray } from '@ember/array';
import { run } from '@ember/runloop';
import RSVP from 'rsvp';
import { inject as service } from '@ember/service';
import { tracked } from "@glimmer/tracking";
import { action } from "@ember/object";
import moment from 'moment';
import {d3, seismogram, seismographconfig, seismograph, ringserverweb} from 'seisplotjs';

export default class IndexRoute extends Route {
  @service dataLatency;
  model() {
    return this.dataLatency.queryLatency();
  }
  async afterModel() {
    //this.startRefreshing();
    //await this.queryLatency();
  }
  @action updateLatency() {
    console.log(`IndexRoute  @action updateLatency()`);
    this.dataLatency.queryLatency();
  }

  @action willTransition() {
    console.log(`IndexRoute  @action willTransition()`);
    this.get('controller').refreshing = false;
    return true;
  }

  setupController(controller, model) {
    console.log("### setupController IndexController");
    super.setupController(controller, model);

    controller.startRefreshing();
  }
}
