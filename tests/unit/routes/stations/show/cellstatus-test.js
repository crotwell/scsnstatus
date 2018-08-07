import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Route | stations/show/cell status', function(hooks) {
  setupTest(hooks);

  test('it exists', function(assert) {
    let route = this.owner.lookup('route:stations/show/cell-status');
    assert.ok(route);
  });
});
