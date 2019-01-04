import Route from '@ember/routing/route';
import RSVP from 'rsvp';
import moment from 'moment';

export default Route.extend({
  model: function(params) {
    let monthAgo = moment.utc().subtract(30, 'day');
    let appModel = this.modelFor('application');
    let quakeQueryParams = {
      startTime: monthAgo.toISOString(),
      minMag: 6.0,
      format: 'xml',
    };
    return RSVP.hash({
      stationList: this.store.query('station',
                                    { networkCode: appModel.networkCode}),
      quakeQueryParams: quakeQueryParams,
      quakeList: this.store.query('quake', quakeQueryParams),
      center: {
        latitude: 0,
        longitude: -180,
      }
    });
  },
  afterModel: function(model) {
    model.magList = RSVP.all(model.quakeList.map( q => q.prefMagnitude));
    model.activeStations = model.stationList.filter(s => s.isActive);
    model.inactiveStations = model.stationList.filter(s => ! s.isActive);
    return RSVP.hash(model);
  },
});
