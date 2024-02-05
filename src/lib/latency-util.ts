
import {DateTime, Interval, Duration} from 'luxon';

export function latencyAsText( end ): string {
  let out = "missing";
  if (end){
    const latency = Interval.fromDateTimes(end, DateTime.utc());
    if (latency.length("seconds") < 10) {
      out = "ok";
    } else if (latency.length("seconds") < 150) {
      out = `${Math.round(latency.length("seconds"))} sec`;
    } else if (latency.length("minutes") < 150) {
      out = `${Math.round(latency.length("minutes"))} min`;
    } else if (latency.length("hours") < 48) {
      out = `${Math.round(latency.length("hours"))} hr`;
    } else {
      out = `${Math.round(latency.length("days"))} days`;
    }
  }
  return out;
}

export function latencyVelocityIcon( velocity ) {
  let out = '😀'; // 1f600 = smile
  if (velocity === 0) {
    out =  '☠️'; // 2620 = skull crossbones
  } else if (velocity < 0.5) {
    out =  '😡'; // 1f621 = anger
  } else if (velocity < 0.9) {
    out =  '😰'; // 1f630 = worry
  } else if (velocity > 2.0) {
    out =  '🚀'; // 1f680 = rocket
  } else if (velocity > 1.5) {
    out =  '🏎️'; // 1f3ce = race car
  } else if (velocity > 1.2) {
    out =  '🏇'; // 1f3c7 = horse racing
  } else if (velocity > 1.1) {
    out =  '🏃'; // 1f3c3 = running
  } else {
    out = ""; // 2611 = check
  }
  return out;
}


const breakpoints = {
  good: Duration.fromObject({minutes: 2}),
  worry: Duration.fromObject({minutes: 10}),
  bad: Duration.fromObject({hours: 1}),
};

const LATENCY_GOOD = "latencygood";
const LATENCY_WORRY = "latencyworry";
const LATENCY_BAD = "latencybad";
const LATENCY_BADBAD = "latencybadbad";

export function latencySeriousness(end) {
  let out = LATENCY_BADBAD;
  if (end) {
    const dur = Interval.fromDateTimes(end, DateTime.utc()).toDuration();
    if (dur < breakpoints.good) {
      out = LATENCY_GOOD;
    } else if (dur < breakpoints.worry) {
      out = LATENCY_WORRY;
    } else if (dur < breakpoints.bad) {
      out = LATENCY_BAD;
    }
  }
  return out;
}
