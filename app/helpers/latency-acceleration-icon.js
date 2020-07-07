import { helper } from '@ember/component/helper';

export default helper(function latencyAccelerationIcon([ acceleration ]/*, hash*/) {
  let out = '😀'; // 1f600 = smile
  if (acceleration === 0) {
    out =  '☠️'; // 2620 = skull crossbones
  } else if (acceleration < 0.5) {
    out =  '😡'; // 1f621 = anger
  } else if (acceleration < 0.9) {
    out =  '😰'; // 1f630 = worry
  } else if (acceleration > 2.0) {
    out =  '🚀'; // 1f680 = rocket
  } else if (acceleration > 1.5) {
    out =  '🏎️'; // 1f3ce = race car
  } else if (acceleration > 1.2) {
    out =  '🏇'; // 1f3c7 = horse racing
  } else if (acceleration > 1.1) {
    out =  '🏃'; // 1f3c3 = running
  } else {
    out = ""; // 2611 = check
  }
  return out;
});
