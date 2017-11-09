import EmberRouter from '@ember/routing/router';
import config from './config/environment';

const Router = EmberRouter.extend({
  location: config.locationType,
  rootURL: config.rootURL
});

Router.map(function() {
  this.route('helicorders');
  this.route('stations', function() {
    this.route('show', {
      path: ':station_id'
    }, function() {
      this.route('channel', {
        path: ':channel_id'
      });
    });
  });
});

export default Router;
