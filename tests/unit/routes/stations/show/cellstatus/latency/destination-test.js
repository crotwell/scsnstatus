import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Route | stations/show/cellstatus/latency/destination', function(hooks) {
  setupTest(hooks);

  test('it exists', function(assert) {
    let route = this.owner.lookup('route:stations/show/cellstatus/latency/destination');
    assert.ok(route);
  });
});
