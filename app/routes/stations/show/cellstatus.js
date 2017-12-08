import Route from '@ember/routing/route';
import RSVP from 'rsvp';
import moment from 'moment';

const DEFAULT_DAYS=3;

export default Route.extend({
  model: function(params) {
    let { station_id } = this.paramsFor('stations/show');
    let { station } = this.modelFor('stations/show');
    console.log("station id : "+station_id);
    console.log("station : "+station);

    station = station_id.split('_')[0].split('.')[1];
    let now = moment(); // cellstatus is not utc
    let days = params.days ? params.days : DEFAULT_DAYS;
    let endDate = now;
    if ( params.end && params.end != "now") {
      endDate = moment(params.end);
    }
    let startDate = params.startdate ? moment(params.startdate) : moment(endDate).subtract(days, 'days');

console.log("cellstatus route "+params.days+" "+params.end);
    let year = now.year();
    let startjday = now.dayOfYear()-days;
    let endjday = now.dayOfYear();
    let out = [];
    console.log('station '+params.station_id);
    for (var i = 0; i <= days; i++) {
      let theday = moment(endDate).subtract(i, 'days'); // subtract doesn't clone!
      out.push(this.store.findRecord('cellstatus', station+"_"+theday.year()+"_"+theday.dayOfYear()));
    }
    return RSVP.hash({
      start: startDate,
      end: endDate,
      days: days,
      station: this.store.findRecord('station', station_id),
      cellstatus: RSVP.all(out),
    }).then(hash => {
      hash.network = hash.station.get('network')
      return RSVP.hash(hash);
    });
  },

  queryParams: {
    days: {
      refreshModel: true
    },
    end: {
      refreshModel: true
    }
  }
});
