import DS from 'ember-data';

export default DS.Model.extend({
  station: DS.attr('string'),
  dayOfYear: DS.attr('number'),
  year: DS.attr('number'),
  values: DS.attr()

});
