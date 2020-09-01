import Component from '@glimmer/component';
import { A } from '@ember/array';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { task, timeout } from 'ember-concurrency';
import { tracked } from '@glimmer/tracking';
//import moment from 'moment';
import seisplotjs from 'seisplotjs';

const moment = seisplotjs.moment;

export default class CellStatusLoaderComponent extends Component {

  @service cellStatus;
  @tracked cellStatusData;
  @tracked start;
  @tracked end;
  @tracked duration;

  @(task(function * () {
    const cellStatusData = [];
    const sed = new seisplotjs.util.StartEndDuration(this.start, this.end, this.duration);
    let d = moment.utc(sed.start).startOf('day');
    const today = moment.utc().endOf('day');
    const endOrNow = today.isSameOrBefore(sed.end) ? today : sed.end;
    while (d.isSameOrBefore(endOrNow)) {
      let daycellStatusData = yield this.cellStatus.queryCellStatus(this.args.station.stationCode, d.year(), d.dayOfYear());
      cellStatusData.push(daycellStatusData);
      d=moment.utc(d).add(1, 'day');
    }
    this.cellStatusData = A(cellStatusData);
    this.duration = sed.duration;
    this.start = sed.start;
    this.end = sed.end;
  })) fetchData;

  //tagName = '';
  constructor() {
    super(...arguments);
    this.duration = seisplotjs.moment.duration(1, 'day');
    this.start = moment().subtract(1, 'day');
    this.end = moment();
    this.cellStatusData = A([ ]);
    this.setTimesFromArgs();
  }
  setTimesFromArgs() {
    let duration = null;
    if (this.args.duration) {
      if (seisplotjs.moment.isDuration(this.args.duration)) {
        duration = this.args.duration;
      } else if (typeof this.args.duration === 'string' ) {
        duration = seisplotjs.moment.duration(this.args.duration);
      } else if (typeof this.args.duration === 'object' && typeof this.args.duration.toISOString === 'function') {
        duration = seisplotjs.moment.duration(this.args.duration.toISOString());
      } else {
        duration = seisplotjs.moment.duration(this.args.duration);
      }
    } else if ( ! (this.args.start && this.args.end)) {
      duration = seisplotjs.moment.duration(2, 'days');
    }
    const sed = new seisplotjs.util.StartEndDuration(this.args.start, this.args.end, duration);
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
    this.end = moment.utc();
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
}
