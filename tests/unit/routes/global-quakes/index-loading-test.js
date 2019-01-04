import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Route | global-quakes/index-loading', function(hooks) {
  setupTest(hooks);

  test('it exists', function(assert) {
    let route = this.owner.lookup('route:global-quakes/index-loading');
    assert.ok(route);
  });
});
