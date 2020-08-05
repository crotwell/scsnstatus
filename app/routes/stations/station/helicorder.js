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
      hash.activeChannelList = hash.channelList
        .filter(c => c.activeAt(now))
        .filter(c => c.channelCode !== 'LOG')
        .filter(c => c.channelCode !== 'OCF')
        .filter(c => c.channelCode !== 'ACE');
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
    let bestChannel = model.activeChannelList.find(c => c.channelCode === 'HHZ');
    if ( ! bestChannel) {
      bestChannel = model.activeChannelList.find(c => c.channelCode === 'HNZ');
    }
    if ( ! bestChannel) {
      bestChannel = model.activeChannelList.find(c => c.channelCode.startsWith('H') && c.channelCode.endsWith('Z'))[0];
    }
    if ( ! bestChannel) {
      bestChannel = model.activeChannelList.find(c => c.channelCode.startsWith('B') && c.channelCode.endsWith('Z'))[0];
    }
    if ( ! bestChannel) {
      bestChannel = model.activeChannelList.find(c => c.channelCode.startsWith('L') && c.channelCode.endsWith('Z'))[0];
    }
    if ( ! bestChannel) {
      bestChannel = model.activeChannelList.find(c => c.channelCode.startsWith('S') && c.channelCode.endsWith('Z'))[0];
    }
    if ( ! bestChannel) {
      bestChannel = model.activeChannelList.find(c => c.channelCode.startsWith('E') && c.channelCode.endsWith('Z'))[0];
    }
    if ( ! bestChannel) {
      bestChannel = model.activeChannelList[0];
    }
    controller.selectedChannel = bestChannel;
  }
}
