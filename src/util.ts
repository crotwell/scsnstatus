
import * as sp from 'seisplotjs';

export const SC_QUAKE_URL = "https://eeyore.seis.sc.edu/scsn/sc_quakes/sc_quakes.xml"
export const SC_STATION_URL = "https://eeyore.seis.sc.edu/scsn/sc_quakes/CO_channels.staml"
export const SC_ALL_CHANNELS_URL = "https://eeyore.seis.sc.edu/scsn/sc_quakes/CO_soh.staml"

export function loadNetworks(): Promise<Array<Network>> {
  return sp.stationxml.fetchStationXml(SC_STATION_URL);
}

export function loadStations(): Promise<Array<Station>> {
  return loadNetworks().then(staxml => {
    return Array.from(sp.stationxml.allStations(staxml));
  });
}

export function loadActiveStations(): Promise<Array<Station>> {
  return loadNetworks().then(staxml => {
    return Array.from(sp.stationxml.activeStations(staxml));
  });
}

export function loadAllChannels(): Promise<Array<Station>> {
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
