import Controller from '@ember/controller';
import { computed } from '@ember/object';
import moment from 'moment';

export default Controller.extend({
  queryParams: ['days', 'end'],
  days: 3,
  end: "now",
  prev: computed('end', 'days', function() {
    let end = this.get('end');
    if ( ! end || end === 'now') {
      end = moment();
    }
    return moment(end).subtract(this.get('days') / 2, 'days');
  }),
  prevISO: computed('prev', function() {
    return this.get('prev').toISOString();
  }),
  next: computed('end', 'days', function() {
    let end = this.get('end');
    if ( ! end || end === 'now') {
      end = moment();
    }
    let out = moment(end).add(this.get('days') / 2 , 'days');
    if (out.isAfter(moment())) { out = moment();}
    return out;
  }),
  nextISO: computed('next', function() {
    return this.get('next').toISOString();
  }),

  actions: {
    refresh() {
      let m = this.get('model');
      this.get('model').cellstatus.forEach(cs => {
        cs.reload();
      });
    }
  }
});
