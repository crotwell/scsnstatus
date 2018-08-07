import Route from '@ember/routing/route';
import RSVP from 'rsvp';
import moment from 'moment';

const DEFAULT_DAYS=3;
const DEFAULT_DESTINATION="eeyore";

export default Route.extend({
  model: function(params) {
    let { station_id } = this.paramsFor('stations/show');
    let { station, stationList } = this.modelFor('stations.show');
    console.log("station id : "+station_id);
    console.log("station : "+station);

    station = station_id.split('_')[0].split('.')[1];
    let now = moment(); // cellstatus is not utc
    let days = params.days ? params.days : DEFAULT_DAYS;
    let endDate = now;
    if ( params.end && params.end != "now") {
      console.log("params.end: "+params.end);
      endDate = moment(params.end);
    }
    let startDate = params.startdate ? moment(params.startdate) : moment(endDate).subtract(days, 'days');
    let destination = params.destination ? params.destination : DEFAULT_DESTINATION;
console.log("cellstatus route "+days+" "+endDate+"  "+destination);
    let year = endDate.year();
    let startjday = endDate.dayOfYear()-days;
    let endjday = endDate.dayOfYear();
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
      stationList: stationList,
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
  },
  actions: {
    changeStationOnRoute(station_id, plotname) {
      const routeName = this.routeName;
      const routeA = routeName.split('.');
        console.log(routeName+" route changeStation "+station_id);
      return this.transitionTo(routeName, station_id, { "queryParams": { "end": moment(this.model.end).format("YYYY-MM-DD"),
                                                                         "days": this.model.days }});
    },
    refresh() {
      let m = this.model;
      this.model.cellstatus.forEach(cs => {
        cs.reload();
      });
    },
    goPrev() {
      console.log("cellstatus route goPrev() "+this.controller.get('prev').format("YYYY-MM-DD"));
      this.controller.set('end', this.controller.get('prev').format("YYYY-MM-DD"));
    },
    goNext() {
      console.log("cellstatus route goNext()");
      this.controller.set('end', this.controller.get('next').format("YYYY-MM-DD"));
    },
    goNow() {
      console.log("cellstatus route goNow()");
      this.controller.set('end', "now");
    },


  }
});
