import JSONAPIAdapter from '@ember-data/adapter/json-api';

export default class DailyVoltageAdapter extends JSONAPIAdapter {
  namespace = '/scsn/cell-stats';
  host = 'https://eeyore.seis.sc.edu';
}
