import Controller from '@ember/controller';
import { computed } from '@ember/object';
import moment from 'moment';

export default Controller.extend({
  queryParams: ['days', 'end'],
  days: 3,
  end: "now",
  prev: computed('end', 'days', function() {
    let end = this.end;
    if ( ! end || end === 'now') {
      end = this.midnightAfter(moment());
    }
    return moment(end).subtract(this.days / 2, 'days');
  }),
  prevISO: computed('prev', function() {
    return this.prev.toISOString();
  }),
  next: computed('end', 'days', function() {
    let end = this.end;
    if ( ! end || end === 'now') {
      end = moment();
    }
    let out = moment(end).add(this.days / 2 , 'days');
    if (out.isAfter(moment())) {
      // midnight after now
      out = this.midnightAfter(moment());
    }
    return out;
  }),
  nextISO: computed('next', function() {
    return this.next.toISOString();
  }),
  midnightAfter(date) {
    if (date === 'now') { date = moment();}
    return moment(date).add(1, 'days').hours(0).minutes(0).seconds(0).millisecond(0);
  },

  actions: {
    refresh() {
      let m = this.model;
      this.model.cellstatus.forEach(cs => {
        cs.reload();
      });
    }
  }
});
