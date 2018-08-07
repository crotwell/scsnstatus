import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Route | stations/show/cellstatus/voltage', function(hooks) {
  setupTest(hooks);

  test('it exists', function(assert) {
    let route = this.owner.lookup('route:stations/show/cellstatus/voltage');
    assert.ok(route);
  });
});
