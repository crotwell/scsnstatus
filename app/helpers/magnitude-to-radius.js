import { helper } from '@ember/component/helper';

export function magnitudeToRadius([ magValue, scaleFactor ] ) {
  if (! scaleFactor) {scaleFactor = 1;}
  return scaleFactor * magValue;
}

export default helper(magnitudeToRadius);
