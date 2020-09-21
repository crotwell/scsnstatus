import Service from '@ember/service';
import RSVP from 'rsvp';
import seisplotjs from 'seisplotjs';
import {
  convertToSeisplotjs,
  convertQuakeToSPjS
} from 'ember-seisplotjs/utils/convert-to-seisplotjs';

const MINMAX_URL = "http://eeyore.seis.sc.edu/minmax";
const MSEED_URL = "http://eeyore.seis.sc.edu/mseed";
const PATTERN = "%n/%s/%Y/%j/%n.%s.%l.%c.%Y.%j.%H";

export default class CachingMseedarchiveService extends Service {
  minmaxUrl;
  mseedUrl;
  mseedQ;
  minMaxQ;
  pattern = PATTERN;
  cache = [];
  maxCacheLength = 100;
  constructor() {
    super(...arguments);
    this.configureUrls();
  }

  configureUrls(mseedUrl, minmaxUrl, pattern) {
    if (pattern) {this.pattern = pattern;}
    if (minmaxUrl) {
      this.minmaxUrl = minmaxUrl;
    } else {
      this.minmaxUrl = MINMAX_URL;
    }
    if (mseedUrl) {
      this.mseedUrl = mseedUrl;
    } else {
      this.mseedUrl = MSEED_URL;
    }
    this.minMaxQ = new seisplotjs.mseedarchive.MSeedArchive(
      this.minmaxUrl,
      this.pattern);
    this.mseedQ = new seisplotjs.mseedarchive.MSeedArchive(
      this.mseedUrl,
      this.pattern);
  }
  /**
   * Loads data suitable where number of pixels is small relative to number of
   * data points, like in a helicorder. SCSN keeps 2sps data that corresponds
   * to min/max per second of the >100sps H?? channels for this purpose.
   * The HH? channels map to LX? and the HN? map to LY?
   * @param  {[type]} channel  [description]
   * @param  {[type]} startEnd [description]
   * @return {[type]}          [description]
   */
  loadForHelicorder(channel, startEnd) {
    let fake;
    const convertChannel = convertToSeisplotjs(channel.station.get('network'), channel.station, channel);
    let query;
    if (convertChannel.channelCode.charAt(0) === 'H') {
      const minMaxInstCode = convertChannel.channelCode.charAt(1) === 'H' ? 'X' : 'Y';
      let chanCode = "L"+minMaxInstCode+convertChannel.channelCode.charAt(2);
      fake = new seisplotjs.stationxml.Channel(convertChannel.station, chanCode, convertChannel.locationCode);
      fake.sampleRate = 2;
      query = this.minMaxQ;
    } else {
      fake = convertChannel;
      query = this.mseedQ
    }
    let sdd = seisplotjs.seismogram.SeismogramDisplayData.fromChannelAndTimeWindow(fake, startEnd);
    return this._internalLoadSeismograms([sdd], query);
  }

  loadSeismograms(channel, startEnd) {
    const convertChannel = convertToSeisplotjs(channel.station.get('network'), channel.station, channel);
    let sdd = seisplotjs.seismogram.SeismogramDisplayData.fromChannelAndTimeWindow(convertChannel, startEnd);
    return this._internalLoadSeismograms([sdd], this.mseedQ);
  }

  _internalLoadSeismograms(sddList, query) {
    let out = [];
    const mythis = this;
    for (let sdd of sddList) {
      let found = false;
      for (let cachesdd of this.cache) {
        if (cachesdd.channel.codes() === sdd.channel.codes() && cachesdd.timeWindow.contains(sdd.timeWindow)) {
          console.log(`found in cache: ${sdd.channel.codes()} ${sdd.timeWindow}`);
          sdd.seismogram = cachesdd.seismogram;
          out.push(sdd);
          found = true;
          break;
        }
      }
      if ( ! found) {
        out.push(query.loadSeismograms([sdd]));
      }
    }
    return RSVP.all(out).then(sddList => {
      let out = [];
      for (let sdd of sddList) {
        if (Array.isArray(sdd)) {
          out = out.concat(sdd);
        } else {
          out.push(sdd);
        }
      }
      return out;
    }).then(sddList => {
      mythis.cache = mythis.cache.concat(sddList);
      while (mythis.cache.length > mythis.maxCacheLength) {
        mythis.cache.shift();
      }
      return sddList;
    });
  }
}
