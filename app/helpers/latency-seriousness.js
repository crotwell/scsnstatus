import { helper } from '@ember/component/helper';
import moment from 'moment';

const breakpoints = {
  good: moment.duration(2, 'minutes'),
  worry: moment.duration(10, 'minutes'),
  bad: moment.duration(1, 'hour')
};

export default helper(function latencySeriousness([endtime]/*, hash*/) {
  if (! endtime) {return "unknown"};

  const dur = moment.duration(moment.utc().diff(endtime));
  let out = "latencybadbad";
  if (dur.asMilliseconds() < breakpoints.good.asMilliseconds()) {
    out = "latencygood";
  } else if (dur.asMilliseconds() < breakpoints.worry.asMilliseconds()) {
    out = "latencyworry";
  } else if (dur.asMilliseconds() < breakpoints.bad.asMilliseconds()) {
    out = "latencybad";
  }
  return out;
});
