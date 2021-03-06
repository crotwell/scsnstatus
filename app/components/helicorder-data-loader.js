import Component from '@glimmer/component';
import { A } from '@ember/array';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { task, timeout } from 'ember-concurrency';
import { tracked } from '@glimmer/tracking';
import RSVP from 'rsvp';
//import moment from 'moment';
import seisplotjs from 'seisplotjs';
import {
  convertToSeisplotjs,
  convertQuakeToSPjS
} from 'ember-seisplotjs/utils/convert-to-seisplotjs';

const moment = seisplotjs.moment;

const MINMAX_URL = "http://eeyore.seis.sc.edu/minmax";
const MSEED_URL = "http://eeyore.seis.sc.edu/mseed";

function roundTime(time, unit) {
  return seisplotjs.moment.utc(time).endOf(unit).add(1, 'millisecond');
}

export default class HelicorderDataLoaderComponent extends Component {
  @service store;
  @service cachingMseedarchive;
  @tracked channel;
  @tracked helicorderData;
  @tracked start;
  @tracked end;
  @tracked duration;

  @(task(function * () {
    const mythis = this;
    const c = mythis.args.channel;
    if (! c) { console.log(`in heli load task: missing channel ${c} ${this.args.channel} ${this.channel}`); return;}
    console.log(`in heli load task: ${c}  ${c.constructor.name}`)
    console.log(`in heli load task: ${c.get('codes')}  ${c.get('station')}`)

    const startEnd = new seisplotjs.util.StartEndDuration(this.start, this.end, this.duration);
    yield this.cachingMseedarchive.loadForHelicorder(c, startEnd)
      .then( heliData => {
        // hd should be same as passed in array, so one element eq to sdd
        console.log(`got helidata: ${heliData[0]}`);
        let nowMarker = { markertype: 'predicted', name: "now", time: moment.utc() };
        for (let h of heliData) {
          h.addMarkers(nowMarker);
        }
        mythis.helicorderData = heliData[0];
        mythis.duration = startEnd.duration;
        mythis.start = startEnd.start;
        mythis.end = startEnd.end;
        return heliData[0];
      });
  })) fetchData;

  //tagName = '';
  constructor() {
    super(...arguments);
    this.duration = seisplotjs.moment.duration(1, 'day');
    this.start = moment().subtract(1, 'day');
    this.end = moment();
    this.cellStatusData = A([ ]);
    this.setTimesFromArgs();
    this.channel = this.args.channel;

  }
  setTimesFromArgs() {
    console.log(`setTimesFromArgs: ${this.args.duration} `)
    let duration = null;
    if (this.args.duration) {
      if (seisplotjs.moment.isDuration(this.args.duration)) {
        duration = this.args.duration;
      } else if (typeof this.args.duration === 'string' ) {
        duration = seisplotjs.moment.duration(this.args.duration);
        console.log(`string: ${duration}  ${seisplotjs.moment.duration("P0Y0M1D")}`)
      } else if (typeof this.args.duration === 'object' && typeof this.args.duration.toISOString === 'function') {
        duration = seisplotjs.moment.duration(this.args.duration.toISOString());
      } else {
        duration = seisplotjs.moment.duration(this.args.duration);
        console.log(`else in set duration: ${this.args.duration}  ${duration}`)
      }
    } else if ( ! (this.args.start && this.args.end)) {
      duration = seisplotjs.moment.duration(2, 'days');
    }
    let roundedEnd = this.args.end ? this.args.end : roundTime(seisplotjs.moment.utc(), 'hour');
    const sed = new seisplotjs.util.StartEndDuration(this.args.start, roundedEnd, duration);
    this.duration = sed.duration;
    this.start = sed.start;
    this.end = sed.end;

  }

  @action doLoad() {
    this.fetchData.perform();
  }

  @action doUpdate() {
    this.fetchData.perform();
  }
  @action refresh() {
    this.fetchData.perform();
  }
  @action goPrev() {
    const shift = moment.duration(this.duration.asMilliseconds()/2); // 1/2 original
    this.start = moment.utc(this.start).subtract(shift);
    this.end = moment.utc(this.end).subtract(shift);
    this.fetchData.perform();
  }
  @action goNext() {
    const shift = moment.duration(this.duration.asMilliseconds()/2); // 1/2 original
    this.start = moment.utc(this.start).add(shift);
    this.end = moment.utc(this.end).add(shift);
    this.fetchData.perform();
  }
  @action goNow() {
    if (this.duration.asHours() > 6) {
      this.end = roundTime(moment.utc(), 'hour');
    } else {
      this.end = moment.utc();
    }
    this.start = moment.utc(this.end).subtract(this.duration);
    this.fetchData.perform();
  }

  @action zoomIn() {
    this.duration = moment.duration(this.duration.asMilliseconds()/2);
    const shift = moment.duration(this.duration.asMilliseconds()/2); // 1/4 original
    this.start = moment.utc(this.start).add(shift);
    this.end = moment.utc(this.end).subtract(shift);
    this.fetchData.perform();
  }
  @action zoomOut() {
    const shift = moment.duration(this.duration.asMilliseconds()/2); // 1/2 original
    this.duration = moment.duration(this.duration.asMilliseconds()*2);
    this.start = moment.utc(this.start).subtract(shift);
    this.end = moment.utc(this.end).add(shift);
    this.fetchData.perform();
  }
  @action zoomDay() {
    this.duration = moment.duration(24, 'hour');
    this.start = null;
    this.end = roundTime(this.end, 'hour');
    this.fetchData.perform();
  }
  @action zoom12Day() {
    this.duration = moment.duration(12, 'day');
    this.start = null;
    this.end = roundTime(this.end, 'day');
    this.fetchData.perform();
  }
}
