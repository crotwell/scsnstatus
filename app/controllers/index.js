import Controller from '@ember/controller';
import { tracked } from "@glimmer/tracking";
import { action } from "@ember/object";
import { inject as service } from '@ember/service';
import { run } from '@ember/runloop';

export default class IndexController extends Controller {
  @service dataLatency;

  @tracked refreshing = true;
  @action willTransition() {
    console.log(`IndexController  @action willTransition()`);
    this.refreshing = false;
    return true;
  }
  @action updateLatency() {
    return this.dataLatency.queryLatency();
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
    this.dataLatency.queryLatency();
    this.clearTimer();

    if (this.dataLatency.updateInterval) {
      /*
       * NOTE: intentionally a setTimeout so tests do not block on it
       * as the run loop queue is never clear so tests will stay locked waiting
       * for queue to clear.
       */
      this.intervalTimer = setTimeout(() => {
        run(() => this.refresh());
      }, this.dataLatency.updateInterval);
    }
  }

  clearTimer() {
    clearTimeout(this.intervalTimer);
  }

  willDestroy() {
    this.super(...arguments);
    this.clearTimer();
  }
}
