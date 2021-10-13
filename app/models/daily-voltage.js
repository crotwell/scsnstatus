import Model from '@ember-data/model';
import { attr, belongsTo, hasMany } from '@ember-data/model';

export default class DailyVoltageModel extends Model {
  @attr('string') station;
  @attr('number') year;
  @attr() volt;

}
