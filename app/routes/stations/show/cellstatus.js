import Route from '@ember/routing/route';
import RSVP from 'rsvp';

export default Route.extend({
  model: function(params) {
    let { station_id } = this.paramsFor('stations/show');
    console.log("station id : "+station_id);
    let station = 'CASEE';
let year = 2017;
let startjday = 302;
let endjday = 304;
    //station = params.station
    //year = params.year
    //params.startjday
    //params.endjday
    let out = [];
    console.log('station '+params.station_id);
    for (var i = startjday; i < endjday; i++) {
      out.push(this.store.findRecord('cellstatus', station+"_"+year+"_"+i));
    }
    return RSVP.all(out);
  }
});
