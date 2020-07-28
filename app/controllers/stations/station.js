import Controller from '@ember/controller';
import { action } from "@ember/object";
import { inject as service } from '@ember/service';

export default class StationsStationController extends Controller {
  @service router;

  get activeRoute() {
    return this.router.currentRouteName;
  }

  get plotType() {
    console.log(`StationsStationController plotType: ${this.activeRoute}`);
    let splitRoute = this.activeRoute.split('.');
    return splitRoute[splitRoute.length-1];
  }

  @action changeStation(station_id) {
    this.transitionToRoute(this.activeRoute, station_id);
  }

  @action changePlot(plot_id) {
    let route = this.router.currentRoute;
    console.log(`changePlot ${plot_id}  ${route.parent.params.station_id}`)
    this.transitionToRoute(`stations.station.${plot_id}`, route.parent.params.station_id);
  }
}
