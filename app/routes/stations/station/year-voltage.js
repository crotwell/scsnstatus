import Route from '@ember/routing/route';
import RSVP from 'rsvp';

import seisplotjs from 'seisplotjs';
const moment = seisplotjs.moment;

export default class StationsStationYearVoltageRoute extends Route {
  model() {
    let stationModel = this.modelFor('stations/station');
    const today = moment.utc().endOf('day');
    const last_year = moment.utc(today).subtract(1, 'year');
    let sta_year = `${stationModel.station.stationCode}_${today.year()}`;
    let prev_sta_year = `${stationModel.station.stationCode}_${last_year.year()}`;
    return RSVP.hash({
      currPlot: 'voltage',
      station: stationModel.station,
      stationList: stationModel.stationList,
      appModel: stationModel.appModel,
      voltData: this.store.findRecord('dailyVoltage', sta_year),
      prevVoltData: this.store.findRecord('dailyVoltage', prev_sta_year),
    }).then(hash => {
      return RSVP.hash(hash);
    });
  }
}
