import Component from '@ember/component';
import { inject as service } from '@ember/service';
import SeismogramDisplay  from 'ember-seisplotjs/components/seismogram-display';

export default SeismogramDisplay.extend({
  mseedArchive: service(),
  loadDataForChannel: function(channel) {
    const ds = this.mseedArchive;
    let seconds = 300;
    let sps = channel.sampleRate;
    if (sps > 1) {
      seconds = 300;
    } else if (sps <= .2) {
      seconds = 86400;
    } else {
      seconds = 3600;
    }
    return ds.load(channel, seconds, moment.utc());
  },
});
