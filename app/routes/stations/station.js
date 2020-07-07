import Route from '@ember/routing/route';
import RSVP from 'rsvp';

export default class StationsStationRoute extends Route {

  model(params) {
    return RSVP.hash({
      station: this.store.findRecord('station', params.station_id),
      stationList: RSVP.hash(this.modelFor('stations')).then(hash => hash.stationList)
    });
  }
}
