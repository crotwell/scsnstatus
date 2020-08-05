import Route from '@ember/routing/route';
import RSVP from 'rsvp';
import moment from 'moment';

export default class StationsStationHelicorderRoute extends Route {
  model() {
    let stationModel = this.modelFor('stations/station');
    return RSVP.hash({
      currPlot: 'helicorder',
      station: stationModel.station,
      stationList: stationModel.stationList,
      appModel: stationModel.appModel
    }).then(hash => {
      console.log(`heli route: ${hash.station.channels}`)
      hash.channelList = hash.station.channels;
      return RSVP.hash(hash);
    }).then(hash => {
      const now = moment.utc();
      hash.activeChannelList = hash.channelList.filter(c => c.activeAt(now));
      hash.inactiveChannelList = hash.channelList.filter(c => ! c.activeAt(now));
      hash.staFromChan = hash.channelList.map(c => c.station);
      return RSVP.hash(hash);
    }).then(hash => {
      hash.netFromChan = hash.staFromChan.map(s => s.get('network'));
      return RSVP.hash(hash);
    }).then(hash => {
      console.log(`num active: ${hash.activeChannelList.length}`)
      return RSVP.hash(hash);
    });
  }
  setupController(controller, model) {
    super.setupController(controller, model);
    controller.selectedChannel = model.activeChannelList[0];
  }
}
