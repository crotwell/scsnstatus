import Route from '@ember/routing/route';
import RSVP from 'rsvp';
import moment from 'moment';

export default class StationsStationRssiRoute extends Route {
  model() {
    let stationModel = this.modelFor('stations/station');
    return RSVP.hash({
      currPlot: 'rssi',
      station: stationModel.station,
      stationList: stationModel.stationList,
      appModel: stationModel.appModel,
    }).then(hash => {
      return RSVP.hash(hash);
    });
  }
}
