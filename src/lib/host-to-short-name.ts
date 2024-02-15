import { ringserverweb } from 'seisplotjs';

const nameMap = new Map();
nameMap.set('eeyore.seis.sc.edu', 'eeyore');
nameMap.set('thecloud.seis.sc.edu', 'cloud');
nameMap.set('li1043-95.members.linode.com', 'cloud');
nameMap.set(ringserverweb.IRIS_HOST, 'iris');
nameMap.set('eeyore', 'eeyore');
nameMap.set('thecloud', 'cloud');
nameMap.set('li1043-95', 'cloud');
nameMap.set(ringserverweb.IRIS_HOST.split('.')[0], 'iris');

export default function hostToShortName(host) {
	if (nameMap.has(host)) {
		return nameMap.get(host);
	}
	const shortName = host.split('.')[0];
	if (nameMap.has(shortName)) {
		return nameMap.get(shortName);
	}
	return shortName;
}
