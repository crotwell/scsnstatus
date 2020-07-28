import Route from '@ember/routing/route';
import RSVP from 'rsvp';
import moment from 'moment';

export default class StationsStationChannelsRoute extends Route {
  model() {
    let stationModel = this.modelFor('stations/station');
    return RSVP.hash({
      currPlot: 'channels',
      station: stationModel.station,
      stationList: stationModel.stationList,
      center: stationModel.center,
      networkCode: stationModel.networkCode,
      appModel: stationModel.appModel,
      channelList: stationModel.station.channels
    }).then(hash => {
      const now = moment.utc();
      hash.activeStations = hash.channelList.filter(c => c.activeAt(now));
      hash.inactiveStations = hash.channelList.filter(c => ! c.activeAt(now));
      return RSVP.hash(hash);
    });
  }
}
