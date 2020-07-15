import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Route | stations/station', function(hooks) {
  setupTest(hooks);

  test('it exists', function(assert) {
    let route = this.owner.lookup('route:stations/station');
    assert.ok(route);
  });
});
