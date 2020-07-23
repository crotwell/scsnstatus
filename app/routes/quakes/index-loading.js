import Route from '@ember/routing/route';
import { A } from '@ember/array';
import RSVP from 'rsvp';
import moment from 'moment';

export default class QuakesIndexLoadingRoute extends Route {

    model(params) {
      console.log("QuakesIndexLoadingRoute");
      let appModel = this.modelFor('application');
      let quakeQueryParams = {
        minLat: appModel.SCBoxArea.minLat,
        maxLat: appModel.SCBoxArea.maxLat,
        minLon: appModel.SCBoxArea.minLon,
        maxLon: appModel.SCBoxArea.maxLon,
        startTime: '2009-06-01T00:00:00',
        format: 'xml',
      };
      return {
        stationList: A([]), //this.store.peekAll('station').filter(s => s.networkCode === appModel.networkCode),
        appModel: appModel,
        quakeQueryParams: quakeQueryParams,
        quakeList: A([]),
        center: appModel.SCCenter,
        quakeQueryBox: [ { lat: appModel.SCBoxArea.minLat, lng: appModel.SCBoxArea.minLon},
                         { lat: appModel.SCBoxArea.maxLat, lng: appModel.SCBoxArea.minLon},
                         { lat: appModel.SCBoxArea.maxLat, lng: appModel.SCBoxArea.maxLon},
                         { lat: appModel.SCBoxArea.minLat, lng: appModel.SCBoxArea.maxLon},
        ],
        yearQuakes: A([]),
        oldQuakes: A([])
      };
    }

}
