import { helper } from '@ember/component/helper';
import { default as hToSN } from '../utils/host-to-short-name';

export default helper(function hostToShortName(params/*, hash*/) {
  if ( ! params || params.length === 0) {
    return "";
  }
  return hToSN(params[0]);
});
