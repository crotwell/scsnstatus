import Controller from '@ember/controller';
import { tracked } from "@glimmer/tracking";
import { action } from "@ember/object";
import { inject as service } from '@ember/service';
import { run } from '@ember/runloop';

export default class IndexController extends Controller {



  @tracked updateInterval = 10000;
  @tracked refreshing = true;
  @action willTransition() {
    this.refreshing = false;
  }
  startRefreshing(){
    this.set('refreshing', true);
    console.log("### startRefreshing");
    run.later(this, this.refresh, 10);
  }

  refresh() {
    console.log("refresh");

    if(!this.refreshing) {
      return;
    }
    this.send('updateLatency');
    this.clearTimer();

    if (this.updateInterval) {
      /*
       * NOTE: intentionally a setTimeout so tests do not block on it
       * as the run loop queue is never clear so tests will stay locked waiting
       * for queue to clear.
       */
      this.intervalTimer = setTimeout(() => {
        run(() => this.refresh());
      }, parseInt(this.updateInterval, 10));
    }
  }

  clearTimer() {
    clearTimeout(this.intervalTimer);
  }

  destroy() {
    this.clearTimer();
    this._super(...arguments);
  }
}
