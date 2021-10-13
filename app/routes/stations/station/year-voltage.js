import Route from '@ember/routing/route';
import RSVP from 'rsvp';

export default class StationsStationYearVoltageRoute extends Route {
  model() {
    let stationModel = this.modelFor('stations/station');
    let sta_year = `${stationModel.station.stationCode}_2021`;
    return RSVP.hash({
      currPlot: 'voltage',
      station: stationModel.station,
      stationList: stationModel.stationList,
      appModel: stationModel.appModel,
      voltData: this.store.findRecord('dailyVoltage', sta_year),
    }).then(hash => {
      return RSVP.hash(hash);
    });
  }
}
