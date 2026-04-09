
import * as sp from 'seisplotjs';

import {loadActiveStations} from './util';

export function stationForecast() {
  loadActiveStations().then( stationList => {
    stationList.sort( (a,b) => {
      if (a.stationCode < b.stationCode) { return -1;}
      if (a.stationCode > b.stationCode) { return  1;}
      return 0;
    });
    const nwsUl = document.querySelector("table.forecast");
    nwsUl.innerHTML = '';

    const header = document.createElement("tr");
    header.appendChild(document.createElement("th"));
    nwsUl.appendChild(header);
    const forecastList = [];
    stationList.forEach( (sta, idx) => {
      const tr = document.createElement("tr");
      const staTd = document.createElement("th");
      staTd.textContent = `${sta.stationCode}: `;
      tr.appendChild(staTd);
      nwsUl.appendChild(tr);
      const forecastPromise = sp.nws.loadForecast(sta).then( forecast => {
        const textForecast = forecast.properties.periods
        .filter( curr => {
          if (curr.name === "Tonight" || curr.name.endsWith("Night")) {
            return false;
          }
          return true;
        })
        .forEach(( curr) => {
          if (idx === 0) {
            const forTd = document.createElement("th");
            forTd.textContent = `${curr.name}`;
            header.appendChild(forTd);
          }
          const iconTd = document.createElement("td");
          const iconEl = document.createElement("img");
          iconEl.setAttribute("src", curr.icon);
          iconTd.appendChild(iconEl);
          tr.appendChild(iconTd);
        });
        return forecast;
      }).catch(err => {

        const iconTd = document.createElement("td");
        iconTd.textContent = "Fail";
        tr.appendChild(iconTd);
      });
      forecastList.push(forecastPromise);
    });
    return Promise.all(forecastList);
  });
}

export function nwsSkyCover() {
  const fetchInit = sp.util.defaultFetchInitObj();
  fetchInit["headers"] = {
      "accept": "application/ld+json"
    }

  const nwsList = [ "KCHS", "KCAE", "KGSP", "KUZA"];
  const promiseList = [];
  for (const nwsSta of nwsList) {
    const url = `https://api.weather.gov/stations/${nwsSta}/observations/latest?require_qc=false`
    const fetchProm = sp.util.doFetchWithTimeout(url, fetchInit).then(resp => {
      if (resp.ok) {
        const nwsJson = resp.json();
        return nwsJson;
      } else {
        throw new Error(`fetch ${nwsSta} not ok: ${resp.status}`)
      }
    });
    promiseList.push(sp.nws.nwsObservation(nwsSta));
  }
  return Promise.all(promiseList).then(nwsList => {
    const nwsDiv = document.querySelector("ul.nws");
    if (! nwsDiv) { throw new Error("Unable to find div for weather");}
    nwsList.forEach( nwsJson => {
      const nwsLine = document.createElement("li");
      const skyCover = nwsJson.properties.cloudLayers.reduce( (acc: string, curr: string) => `${acc} ${curr["amount"]}`, "");
      const staName = nwsJson.properties.stationName
      nwsLine.textContent = `${skyCover} - ${nwsJson.properties.stationId} ${staName}: ${nwsJson.properties.textDescription} at ${nwsJson.properties.timestamp}`;
      nwsDiv.appendChild(nwsLine);
    });
  });
}
