import Route from '@ember/routing/route';
import RSVP from 'rsvp';
import moment from 'moment';
import { inject as service } from '@ember/service';

export default class StationsStationLatencyRoute extends Route {
  @service dataLatency;
  model() {
    let stationModel = this.modelFor('stations/station');
    return RSVP.hash({
      currPlot: 'latency',
      station: stationModel.station,
      stationList: stationModel.stationList,
      appModel: stationModel.appModel
    }).then(hash => {
      return RSVP.hash(hash);
    });
  }
}
