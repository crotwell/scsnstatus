import Route from '@ember/routing/route';
import RSVP from 'rsvp';
import moment from 'moment';

export default class StationsStationHelicorderRoute extends Route {
  model() {
    let stationModel = this.modelFor('stations/station');
    return RSVP.hash({
      currPlot: 'helicorder',
      station: stationModel.station,
      stationList: stationModel.stationList,
      appModel: stationModel.appModel
    }).then(hash => {
      const now = moment.utc();
      return RSVP.hash(hash);
    });
  }
}
