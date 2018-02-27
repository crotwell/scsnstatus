import EmberRouter from '@ember/routing/router';
import config from './config/environment';

const Router = EmberRouter.extend({
  location: config.locationType,
  rootURL: config.rootURL
});

Router.map(function() {
  this.route('stations', function() {
    this.route('show', {
      path: ':station_id'
    }, function() {
      this.route('cellstatus', function() {
        this.route('voltage');
        this.route('rssi');
        this.route('latency');
      });

      this.route('channels', function() {
        this.route('show', {
          path: ':channel_id'
        }, function() {});
      });
      this.route('helicorder');
    });
  });
});

export default Router;
