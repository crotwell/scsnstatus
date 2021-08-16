import Component from '@glimmer/component';
import { A } from '@ember/array';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { task, timeout } from 'ember-concurrency';
import { tracked } from '@glimmer/tracking';
import RSVP from 'rsvp';
//import moment from 'moment';
import seisplotjs from 'seisplotjs';
import {convertToSeisplotjs, convertQuakeToSPjS} from 'ember-seisplotjs/utils/convert-to-seisplotjs';

const moment = seisplotjs.moment;

const MINMAX_URL = "http://eeyore.seis.sc.edu/minmax";
const MSEED_URL = "http://eeyore.seis.sc.edu/mseed";
const LOAD_IRIS_TIME = moment.utc().subtract(1, 'year');
function roundTime(time, unit) {
  return seisplotjs.moment.utc(time).endOf(unit).add(1, 'millisecond');
}


export default class SeismogramLoaderComponent extends Component {
  @service store;
  @service cachingMseedarchive;
  @tracked seisDataList;

  @(task(function * () {
    const mythis = this;
    console.log(`begin fetchData task: ${mythis.args.seisDataList.length}`)
    mythis.seisDataList.clear();
    let dataArray;
    if (Array.isArray(mythis.args.seisDataList)) {
      dataArray = A(mythis.args.seisDataList);
    } else {
      dataArray = A( [ mythis.args.seisDataList ] );
    }
    dataArray = dataArray.map(sdd => {
      if ( sdd.hasSeismogram) {
        mythis.seisDataList.pushObject(sdd);
        return sdd;
      } else {
        if (sdd.timeWindow.startTime.isBefore(LOAD_IRIS_TIME)) {
          let dataselectQuery = new seisplotjs.fdsndataselect.DataSelectQuery();
          return dataselectQuery.postQuerySeismograms([sdd]);
        } else {
          return this.cachingMseedarchive.loadForSeisDispList(dataArray)
            .then( seisData => {
              console.log(`got ${seisData.length} seismograms`);
              seisData.forEach(sdd => {
                mythis.seisDataList.pushObject(sdd);
              });
              return seisData;
            });
        }
      }
    });
    yield RSVP.all(dataArray);
  })) fetchData;

  //tagName = '';
  constructor() {
    super(...arguments);
    this.seisDataList = A([]);
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

}
