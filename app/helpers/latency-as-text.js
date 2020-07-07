import { helper } from '@ember/component/helper';

export default helper(function latencyAsText([ end ]/*, hash*/) {
  const latency = moment.duration(moment.utc().diff(end));
  let out = "ok";
  if (latency.asMilliseconds() < 1000) {
    out = "ok";
  } else if (latency.asSeconds() < 10) {
    out = "ok";
  } else if (latency.asSeconds() < 150) {
    out = `${Math.round(latency.asSeconds())} sec`;
  } else if (latency.asMinutes() < 150) {
    out = `${Math.round(latency.asMinutes())} min`;
  } else if (latency.asHours() < 48) {
    out = `${Math.round(latency.asHours())} hr`;
  } else {
    out = `${Math.round(latency.asDays())} days`;
  }
  return out;
});
