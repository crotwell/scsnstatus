import Component from '@ember/component';
import { inject as service } from '@ember/service';
import SeismogramDisplay  from 'ember-seisplotjs/components/seismogram-display';
import seisplotjs from 'ember-seisplotjs';

const ChannelTimeRange = seisplotjs.fdsndataselect.ChannelTimeRange;

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
    let ctr = new ChannelTimeRange(channel, moment.utc().subtract(seconds,'seconds'), moment.utc());
    return ds.loadTraces([ ctr]);
  },
});
