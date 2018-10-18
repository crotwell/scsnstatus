import Route from '@ember/routing/route';
import RSVP from 'rsvp';
import moment from 'moment';

export default Route.extend({
  model: function(params) {
    let appModel = this.modelFor('application');
    let quakeQueryParams = {
      minLat: 31.75,
      maxLat: 35.5,
      minLon: -84,
      maxLon: -78,
      startTime: '2009-06-01T00:00:00',
      format: 'xml',
    };
    return RSVP.hash({
      stationList: this.store.query('station',
                                    { networkCode: appModel.networkCode}),
      quakeQueryParams: quakeQueryParams,
      quakeList: this.store.query('quake', quakeQueryParams),
      center: {
        latitude: 33.75,
        longitude: -81,
      },
      quakeQueryBox: [ { lat: quakeQueryParams.minLat, lng: quakeQueryParams.minLon},
                       { lat: quakeQueryParams.maxLat, lng: quakeQueryParams.minLon},
                       { lat: quakeQueryParams.maxLat, lng: quakeQueryParams.maxLon},
                       { lat: quakeQueryParams.minLat, lng: quakeQueryParams.maxLon},
      ]
    });
  },
  afterModel: function(model) {
    let yearAgo = moment.utc().subtract(1, 'year');
    model.oldQuakes = model.quakeList.filter(q => q.time.isBefore(yearAgo));
    model.yearQuakes = model.quakeList.filter(q => q.time.isAfter(yearAgo));
    model.magList = RSVP.all(model.quakeList.map( q => q.prefMagnitude));
    model.activeStations = model.stationList.filter(s => s.isActive);
    model.inactiveStations = model.stationList.filter(s => ! s.isActive);
    return RSVP.hash(model);
  },
});
