import Adapter from '@ember-data/adapter';
import { inject as service } from '@ember/service';

const DEFAULT_HOST = 'eeyore.seis.sc.edu';
const DEFAULT_PORT = 80;

export default Adapter.extend({
  ajax: service(),
  defaultSerializer: 'cellstatus',
  baseURL: 'http://eeyore.seis.sc.edu/earthworm/cell-stats/',
  findRecord(store, type, id, snapshot) {

      console.log("cell-status adapter findRecord "+id);
      let idSplit = id.split('_');
      let station = idSplit[0];
      let year = idSplit[1];
      let jday = idSplit[2];
      let url = this.baseURL+year+'/'+jday+'/'+station+'.json';
      return this.ajax.request(url)
      .catch(function(error){
        console.log(error);
        console.log("...returning valid but empty value.")
        return {
          "station": station,
          "dayofyear": jday,
          "values": [],
          "year": year
        };
      });
  },
  query(store, type, query) {
    console.log("cell-status adapter query");
    let host = DEFAULT_HOST;
    let port = DEFAULT_PORT;
    let station = null;
    let year = null;
    let jday = null;
    if (query.host) { host = query.host;}
    if (query.port) { port = query.port;}
    if (query.station) { station = query.station;}
    if (query.year) { year = query.year;}
    if (query.jday) { jday = query.jday;}

    let url = this.baseURL+year+'/'+jday+'/'+station+'.json';
    return this.ajax.request(url);

  },
  findAll(store, type, sinceToken) {
    console.log("cell-status adapter findAll");
    throw new Error("No impl findAll");
  },
  XXXfindMany(store, type, ids, snapshots) {
    console.log("cell-status adapter findMany");
    throw new Error("No impl findMany");
  },
  createRecord(store, type, snapshot) {
    throw new Error("cell-status is read-only, create not allowed.");
  },
  deleteRecord(store, type, snapshot) {
    throw new Error("cell-status is read-only, delete not allowed.");
  },
  findHasMany(store, snapshot, link, relationship) {
    throw new Error("No impl findHasMany");
  },

  formBaseURL(protocol, host, port) {
      let colon = ":";
      if (this.protocol().endsWith(colon)) {
        colon = "";
      }
      return this.protocol()+colon+"//"+this.host()+"/fdsnws/dataselect/"+this.specVersion();
  }
});
