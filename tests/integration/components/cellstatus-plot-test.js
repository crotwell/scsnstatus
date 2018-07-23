import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('cellstatus-plot', 'Integration | Component | cellstatus plot', {
  integration: true
});

test('it renders', function(assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{cellstatus-plot}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#cellstatus-plot}}
      template block text
    {{/cellstatus-plot}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
