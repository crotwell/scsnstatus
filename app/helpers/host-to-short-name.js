import { helper } from '@ember/component/helper';

import {
  d3,
  seismogram,
  seismographconfig,
  seismograph,
  ringserverweb
} from 'seisplotjs';

const nameMap = new Map();
nameMap.set("eeyore.seis.sc.edu", "Eeyore");
nameMap.set("thecloud.seis.sc.edu", "Cloud");
nameMap.set(ringserverweb.IRIS_HOST, "IRIS");
nameMap.set("eeyore", "Eeyore");
nameMap.set("thecloud", "Cloud");
nameMap.set(ringserverweb.IRIS_HOST.split('.')[0], "IRIS");

export default helper(function hostToShortName(params/*, hash*/) {
  if ( ! params || params.length === 0) {
    return "";
  }
  if (nameMap.has(params[0])) {
    return nameMap.get(params[0]);
  }
  const shortName = params[0].split('.')[0];
  if (nameMap.has(shortName)) {
    return nameMap.get(shortName);
  }
  return shortName;
});
