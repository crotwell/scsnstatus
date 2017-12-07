import Route from '@ember/routing/route';
import RSVP from 'rsvp';
import moment from 'moment';

export default Route.extend({
  model: function(params) {
    let { station_id } = this.paramsFor('stations/show');
      let { station } = this.modelFor('stations/show');
    console.log("station id : "+station_id);
  console.log("station : "+station);
     station = station_id.split('_')[0].split('.')[1];
     let now = moment(); // cellstatus is not utc
let year = now.year();
let startjday = now.dayOfYear()-3;
let endjday = now.dayOfYear();
    //station = params.station
    //year = params.year
    //params.startjday
    //params.endjday
    let out = [];
    console.log('station '+params.station_id);
    for (var i = startjday; i <= endjday; i++) {
      out.push(this.store.findRecord('cellstatus', station+"_"+year+"_"+i));
    }
    return RSVP.hash({
      station: this.store.findRecord('station', station_id),
      cellstatus: RSVP.all(out),
    }).then(hash => {
      hash.network = hash.station.get('network')
      return RSVP.hash(hash);
    });
  }
});
