import Model, { attr } from '@ember-data/model';

export default Model.extend({
  station: attr('string'),
  dayOfYear: attr('number'),
  year: attr('number'),
  values: attr()

});
