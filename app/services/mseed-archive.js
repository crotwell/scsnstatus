import Service from '@ember/service';

import seisplotjs from 'ember-seisplotjs';
const moment = seisplotjs.moment;

export default Service.extend({

  load(channel, startTime, endTime) {
    if ( ! endTime) {
      endTime = moment.utc();
    }
    if (typeof startTime === 'number') {
      if ( ! (moment.isMoment(endTime))) {
        throw new Error("can't calculate times for s="+startTime+" e="+endTime+", endTme not moment "+endTime.constructor.name);
      }
      startTime = moment.utc(endTime).subtract(startTime, 'seconds');
    }
    if (typeof endTime === 'number') {
      if ( ! (moment.isMoment(startTime))) {
        throw new Error("can't calculate times for s="+startTime+" e="+endTime+", startTme not moment");
      }
      endTime = moment.utc(startTime).add(endTime, 'seconds');
    }


    let host = 'eeyore.seis.sc.edu';
    let port = 80; //6383
    let protocol = 'http:';
    if ("https:" == document.location.protocol) {
      protocol = 'https:'
    }

    let portStr = "";
    if (port != 80) {
      portStr = ":"+port;
    }
    let baseUrl = protocol+"//"+host+portStr+'/mseed';
    let pattern = "%n/%s/%Y/%j/%n.%s.%l.%c.%Y.%j.%H";

    console.log("baseUrl: "+baseUrl);
    let mseedArchive = new seisplotjs.seedlink.MSeedArchive(baseUrl, pattern);

    return mseedArchive.loadData(channel.networkCode,
                                 channel.stationCode,
                                 channel.locationCode,
                                 channel.channelCode,
                                 startTime,
                                 endTime,
                                 channel.sampleRate)
      .then(mseedArray => {
        return seisplotjs.miniseed.mergeByChannel(mseedArray);
      });
  }
});
