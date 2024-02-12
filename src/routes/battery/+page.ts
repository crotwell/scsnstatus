
import type {PageLoad} from './$types';

import { Duration, Interval, DateTime } from 'luxon';

export const load: PageLoad = async ({params, depends, data}) => {
  depends('data:batterystats');
  depends('data:allStations');
  const  sp  = await import('seisplotjs');

  const jsonl_loader = await import("$lib/jsonl_loader.ts");

  const allStations = ["BIRD", 'CASEE', 'CSB', 'HAW', 'HODGE', "JSC", 'PAULI', 'TEEBA'];
  const timerange = Interval.before(DateTime.utc(), Duration.fromISO("P2DT120M"));
  let dataPromise = await jsonl_loader.loadKilovaultStats(allStations, timerange);
  return  {
    batterystats:  dataPromise,
    allStations: allStations,
  };
};
