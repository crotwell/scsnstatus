import { helper } from '@ember/component/helper';
import moment from 'moment';

const breakpoints = {
  good: moment.duration(2, 'minutes'),
  worry: moment.duration(10, 'minutes'),
  bad: moment.duration(1, 'hour')
};

const LATENCY_GOOD = "latencygood";
const LATENCY_WORRY = "latencyworry";
const LATENCY_BAD = "latencybad";
const LATENCY_BADBAD = "latencybadbad";

export default helper(function latencySeriousness([endtime]/*, hash*/) {
  let out = LATENCY_BADBAD;
  if (endtime) {
    const dur = moment.duration(moment.utc().diff(endtime));
    if (dur.asMilliseconds() < breakpoints.good.asMilliseconds()) {
      out = LATENCY_GOOD;
    } else if (dur.asMilliseconds() < breakpoints.worry.asMilliseconds()) {
      out = LATENCY_WORRY;
    } else if (dur.asMilliseconds() < breakpoints.bad.asMilliseconds()) {
      out = LATENCY_BAD;
    }
  }  
  return out;
});
