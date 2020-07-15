import Route from '@ember/routing/route';

export default class ApplicationRoute extends Route {
  async model() {
    return {
      networkCode: 'CO',
      SCBoxArea: {
        minLat: 31.75,
        maxLat: 35.5,
        minLon: -84,
        maxLon: -78
      },
      SCCenter: {
        latitude: 33.75,
        longitude: -81,
      },
      startTime: '2009-06-01T00:00:00',
    };
  }
}
