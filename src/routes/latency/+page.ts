import type { PageLoad } from './$types';

export let _latencyServ = null;

export const load: PageLoad = async ({ params, depends, data }) => {
console.log(`page load: have latency data: ${data?.latency != null}`)
  depends('data:latency');
  const  sp  = await import('seisplotjs');
  const datalatency = await import("$lib/data-latency.ts");

  if (_latencyServ == null) {
    _latencyServ = new datalatency.DataLatencyService();
  }
  const latest = await _latencyServ.queryLatency();
  console.log(`got latency data : ${latest.accessTime}`)
	return {
		post: {
			title: `Title for ${params.slug} goes here`,
			content: `Content for ${params.slug} goes here`,
		},
    dumb: 'dumb text',
    latency: latest,
    previousLatencyCache: _latencyServ.previousLatencyCache,
    statsFailures: _latencyServ.statsFailures,
	};
};
