import Route from '@ember/routing/route';
import RSVP from 'rsvp';
import { inject as service } from '@ember/service';

export default class StationsRoute extends Route {
  @service dataLatency;
  model(params) {
    let { networkCode } = this.modelFor('application');

    return RSVP.hash({
      network: this.store.findRecord('network', networkCode),
      center: {
        latitude: 33.75,
        longitude: -81,
      }
    }).then(function(hash) {
      hash.stationList = hash.network.get('stations');
      return RSVP.hash(hash);
    });
  }
  afterModel(model, transition) {
    console.log("station.index afterModel");
    model.activeStations = model.stationList.filter(s => s.activeAt());
    model.inactiveStations = model.stationList.filter(s => ! s.activeAt());
  }
}
