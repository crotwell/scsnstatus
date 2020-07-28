import Route from '@ember/routing/route';
import RSVP from 'rsvp';

export default class StationsStationRoute extends Route {

  model(params) {
    const appModel = this.modelFor('application');
    const stationsModel = this.modelFor('stations');
    return RSVP.hash({
      station: this.store.findRecord('station', params.station_id),
      stationList: stationsModel.stationList,
      network: stationsModel.networkCode,
      center: appModel.SCCenter,
      appModel: appModel,
      plotTypes: ['channels', 'helicorder', 'latency', 'rssi', 'voltage']
    });
  }
}
