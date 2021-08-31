import Route from '@ember/routing/route';
import { A } from '@ember/array';
import RSVP from 'rsvp';
import moment from 'moment';
import seisplotjs from 'seisplotjs';
import { inject as service } from '@ember/service';

export default class GlobalQuakesIndexRoute extends Route {

    @service cachingQuake;
    model(params) {
      let appModel = this.modelFor('application');
      return RSVP.hash(appModel)
      .then(appModel => {
        let globalQuakeQueryParams = {
          minMag: appModel.quakeQueryParams.global.minMag,
          startTime: moment.utc().subtract(30, 'days'),
          format: 'xml',
        };
        let regionalQuakeQueryParams = {
          latitude: appModel.SCCenter.latitude,
          longitude: appModel.SCCenter.longitude,
          maxRadius: 10,
          minMag: 4.5,
          startTime: moment.utc().subtract(30, 'days'),
          format: 'xml',
        };
        return RSVP.hash({
          stationList: this.store.query('station',
                                        { networkCode: appModel.networkCode}),
          appModel: appModel,
          globalQuakeQueryParams: globalQuakeQueryParams,
          regionalQuakeQueryParams: regionalQuakeQueryParams,
          quakeHash: this.cachingQuake.load(),
          center: appModel.SCCenter,
          regionalQuakeQueryCircle: {
            center: appModel.SCCenter,
            circleOptions: {
              radius: seisplotjs.distaz.degtokm(regionalQuakeQueryParams.maxRadius)*1000
            }
          }
        });
      }).then(hash => {
        hash.quakeList = A([]);
        hash.quakeList.addObjects(hash.quakeHash.regionalQuakeList);
        hash.quakeList.addObjects(hash.quakeHash.globalQuakeList);
        console.log(`qualeList len: ${hash.quakeList.length}`);
        return RSVP.hash(hash);
      });
    }

    afterModel(model) {
      const yearAgo = moment.utc().subtract(1, 'year');
      model.oldQuakes = model.quakeList.filter(q => q.time.isBefore(yearAgo));
      model.recentQuakes = model.quakeList.filter(q => q.time.isAfter(yearAgo));
      model.magList = RSVP.all(model.quakeList.map( q => q.preferredMagnitude));
      model.activeStations = model.stationList.filter(s => s.isActive);
      model.inactiveStations = model.stationList.filter(s => ! s.isActive);
      return RSVP.hash(model);
    }
}
