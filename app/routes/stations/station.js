import Route from '@ember/routing/route';
import RSVP from 'rsvp';

export default class StationsStationRoute extends Route {

  model(params) {
    const appModel = this.modelFor('application');
    const stationsModel = this.modelFor('stations');
    return RSVP.hash({
      station: this.store.findRecord('station', params.station_id),
      stationList: stationsModel.stationList,
      networkCode: stationsModel.networkCode,
      center: appModel.SCCenter,
      appModel: appModel,
      plotTypes: ['channels', 'helicorder', 'latency', 'rssi', 'voltage', 'year-voltage']
    }).then(hash => {
      hash.network = hash.station.network;
      return RSVP.hash(hash);
    });
  }
}
