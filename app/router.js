import EmberRouter from '@ember/routing/router';
import config from './config/environment';

export default class Router extends EmberRouter {
  location = config.locationType;
  rootURL = config.rootURL;
}

Router.map(function() {
  this.route('quakes', function() {
    this.route('quake', { path: '/:quake_id' }, function() {});
    this.route('index-loading');
  });
  this.route('resources');
  this.route('stations', function() {
    this.route('station', { path: '/:station_id' }, function() {
      this.route('voltage');
      this.route('channels');
      this.route('helicorder');
      this.route('latency');
      this.route('rssi');
    });
  });
  this.route('global-quakes', function() {
    this.route('quake', { path: '/:quake_id' }, function() {});
    this.route('quake-loading');
  });
});
