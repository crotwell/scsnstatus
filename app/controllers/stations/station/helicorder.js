import Controller from '@ember/controller';
import { action } from "@ember/object";
import { tracked } from '@glimmer/tracking';
import { inject as service } from '@ember/service';
import RSVP from 'rsvp';

export default class StationsStationHelicorderController extends Controller {
  @service store;
  @tracked selectedChannel;
  @action changeChannel(c) {
    console.log(`changeChannel: ${c}  ${typeof c}`);
    if (typeof c === 'string') {
      this.store.find('channel', c).then(cc => {
        let hash = {};
        hash.channel = cc;
        return RSVP.hash(hash);
      }).then(hash => {
        hash.station = hash.channel.station;
        return RSVP.hash(hash);
      }).then(hash => {
        hash.network = hash.station.network;
        return RSVP.hash(hash);
      }).then(hash => {
        this.selectedChannel = hash.channel;
      });
    } else {
      this.selectedChannel = c;
    }
  }
}
