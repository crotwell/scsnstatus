
import * as sp from 'seisplotjs';

export const SC_QUAKE_URL = "https://eeyore.seis.sc.edu/scsn/sc_quakes/sc_quakes.xml"
export const SC_STATION_URL = "https://eeyore.seis.sc.edu/scsn/sc_quakes/CO_channels.staml"
export const SC_ALL_CHANNELS_URL = "https://eeyore.seis.sc.edu/scsn/sc_quakes/CO_soh.staml"
export const EEYORE_HOST = "eeyore.seis.sc.edu";
export const THECLOUD_HOST = "thecloud.seis.sc.edu";

export function calcHost(): String {
  if (document.URL.toLowerCase().includes(THECLOUD_HOST)) {
    return THECLOUD_HOST;
  }
  return EEYORE_HOST;
}

export function loadNetworks(): Promise<Array<sp.stationxml.Network>> {
  return sp.stationxml.fetchStationXml(SC_STATION_URL);
}

export function loadStations(): Promise<Array<sp.stationxml.Station>> {
  return loadNetworks().then(staxml => {
    return Array.from(sp.stationxml.allStations(staxml));
  });
}

export function loadActiveStations(): Promise<Array<sp.stationxml.Station>> {
  return loadNetworks().then(staxml => {
    return Array.from(sp.stationxml.activeStations(staxml));
  });
}

export function loadAllChannels(): Promise<Array<sp.stationxml.Station>> {
  return sp.stationxml.fetchStationXml(SC_ALL_CHANNELS_URL).then(staxml => {
    return Array.from(sp.stationxml.allStations(staxml));
  });
}


export const stationList = [
  "BARN",
  "BELLE",
  "BIRD",
  "C1SC",
  "CASEE",
  "CSB",
  "HAW",
  "HODGE",
  "JSC",
  "PAULI",
  "SUMMV",
  "TEEBA",
];
