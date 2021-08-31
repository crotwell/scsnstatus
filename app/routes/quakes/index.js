import Route from '@ember/routing/route';
import RSVP from 'rsvp';
import moment from 'moment';
import { inject as service } from '@ember/service';


export default class QuakesIndexRoute extends Route {

  @service cachingQuake;
  model(params) {
    let appModel = this.modelFor('application');
    let quakeQueryParams = {
      minLat: appModel.SCBoxArea.minLat,
      maxLat: appModel.SCBoxArea.maxLat,
      minLon: appModel.SCBoxArea.minLon,
      maxLon: appModel.SCBoxArea.maxLon,
      startTime: '2009-06-01T00:00:00',
      format: 'xml',
    };
    return RSVP.hash({
      stationList: this.store.query('station',
                                    { networkCode: appModel.networkCode}),
      appModel: appModel,
      quakeQueryParams: quakeQueryParams,
      quakeList: this.cachingQuake.loadLocal(),
      center: appModel.SCCenter,
      quakeQueryBox: [ { lat: appModel.SCBoxArea.minLat, lng: appModel.SCBoxArea.minLon},
                       { lat: appModel.SCBoxArea.maxLat, lng: appModel.SCBoxArea.minLon},
                       { lat: appModel.SCBoxArea.maxLat, lng: appModel.SCBoxArea.maxLon},
                       { lat: appModel.SCBoxArea.minLat, lng: appModel.SCBoxArea.maxLon},
      ]
    });
  }

  afterModel(model) {
    const yearAgo = moment.utc().subtract(1, 'year');
    model.oldQuakes = model.quakeList.filter(q => q.time.isBefore(yearAgo));
    model.yearQuakes = model.quakeList.filter(q => q.time.isAfter(yearAgo));
    model.magList = RSVP.all(model.quakeList.map( q => q.prefMagnitude));
    model.activeStations = model.stationList.filter(s => s.isActive);
    model.inactiveStations = model.stationList.filter(s => ! s.isActive);
    return RSVP.hash(model);
  }
}
