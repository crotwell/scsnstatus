import './style.css';

import {DataLatencyService, HOST_LIST} from './data-latency';
import {createNavigation} from './navbar';
import * as sp from 'seisplotjs';
import * as luxon from 'luxon';

createNavigation();


const app = document.querySelector<HTMLDivElement>('#app')!

app.innerHTML = `
  <div class="stations">
    <p class="status"></p>
    <table class="latency">
    <thead>
    <tr>
      <th></th>
      <th class="eeyore">Eeyore</th>
      <th></th>
      <th></th>
      <th class="tabledivider"></th>


      <th class="cloud">Cloud</th>
      <th></th>
      <th></th>
      <th class="tabledivider"></th>


      <th class="iris">Iris</th>
      <th></th>
      <th></th>
      <th class="tabledivider"></th>
    </tr>
    <tr>
      <th>Station</th>
      <th>UTC</th>
      <th>Latency</th>
      <th>Rate</th>
      <th></th>

      <th>UTC</th>
      <th>Latency</th>
      <th>Rate</th>
      <th></th>

      <th>UTC</th>
      <th>Latency</th>
      <th>Rate</th>
      <th></th>
    </tr>
    </thead>
    <tbody>
    </tbody>
    </table>

    <h5>Access at <span class="access_time"></span>,
      <span class="access_age"></span> seconds ago.
    </h5>
    <h5>Rate averaged over last <span class="averaged_over">-</span> seconds.</h5>
    <h5>Update Interval: <span class="update_interval">-</span> seconds</h5>
    <h5>UTC: <span class="now_utc"></span></h5>
    <h5>Local: <span class="now_local"></span></h5>
  </div>
  <div class="datakeys"></div>
  <div><pre class="raw"></pre></div>
`;

const latencyServ = new DataLatencyService();

const breakpoints = {
  good: luxon.Duration.fromISO('PT2M'),
  worry: luxon.Duration.fromISO('PT10M'),
  bad: luxon.Duration.fromISO('PT1H')
};

const LATENCY_GOOD = "latencygood";
const LATENCY_WORRY = "latencyworry";
const LATENCY_BAD = "latencybad";
const LATENCY_BADBAD = "latencybadbad";

const DATE_FORMAT = "yyyy-MM-dd HH:mm:ss";

function updateNow() {
    document.querySelector(".now_utc").textContent =
      luxon.DateTime.utc().toFormat(DATE_FORMAT);
    document.querySelector(".now_local").textContent =
      luxon.DateTime.now().toFormat(DATE_FORMAT);
    if (latencyServ.latencyData != null ) {
      document.querySelector(".access_age").textContent =
        luxon.Interval.fromDateTimes(latencyServ.latencyData.accessTime, luxon.DateTime.utc())
        .toDuration().as("seconds").toFixed(0);;
    }
    setTimeout( () => {
      updateNow();
    }, 100)
}
updateNow();

export function latencySeriousness(endtime: luxon.DateTime): string {
  let out = LATENCY_BADBAD;
  if (endtime) {
    const dur = luxon.DateTime.utc() - endtime;
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

export function latencyAsText( end ) {
  let out = "missing";
  const now = luxon.DateTime.utc();
  if (end){
    const latency = luxon.Interval.fromDateTimes(end, now).toDuration();
    if (latency.toMillis() < 1000) {
      out = "ok";
    } else if (latency.as('seconds') < 10) {
      out = "ok";
    } else if (latency.as('seconds') < 150) {
      out = `${Math.round(latency.as('seconds'))} sec`;
    } else if (latency.as('minutes') < 150) {
      out = `${Math.round(latency.as('minutes'))} min`;
    } else if (latency.as('hours') < 48) {
      out = `${Math.round(latency.as('hours'))} hr`;
    } else {
      const latencyInt = luxon.Interval.fromDateTimes(end, now);

      document.querySelector("pre.raw").textContent =
      `${end}  ${latencyInt}  days latency: ${latency.toMillis()} s: ${latency.as('seconds')} h: ${latency.as('hours')}`;
      out = `${Math.round(latency.as('days'))} days`;
    }
  }
  return out;
}

export function latencyVelocityIcon( velocity) {
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

function createItemsForHost(ld: LatencyData, host: string): string {
  const hostLd = ld[host];
  if ( ! hostLd) {
    // missing?
    return `

      <td class="latencytime ${host} ${LATENCY_BADBAD}">--:--:--</td>
      <td class="latencytext ${host} ${LATENCY_BADBAD}">-</td>
      <td class="vel ${host}">${0.00}</td>
      <td class="velicon ${host}">${latencyVelocityIcon(0)}</td>

    `;
  }

  const hostVel = ld.velocity[host];
  return `

    <td class="latencytime ${host} ${latencySeriousness(hostLd.end)}">
      ${hostLd.end.toFormat('HH:mm:ss')}
    </td>
    <td class="latencytext ${host} ${latencySeriousness(hostLd.end)}">
      ${latencyAsText(hostLd.end)}</td>
    <td class="vel ${host}">${hostVel.toFixed(2)}</td>
    <td class="velicon ${host}">${latencyVelocityIcon(hostVel)}</td>

  `;
}

function updateLatency() {
  const latencyPromise = latencyServ.queryLatency().then(ldata => {
    const div = document.querySelector("div.stations");
    div.querySelector(".access_time").textContent = ldata.accessTime.toISO();
    div.querySelector(".access_age").textContent =
      luxon.Interval.fromDateTimes(ldata.accessTime, luxon.DateTime.utc())
      .toDuration().toHuman();
    if (latencyServ.previousLatencyCache != null) {
      div.querySelector(".averaged_over").textContent =
        luxon.Interval.fromDateTimes(latencyServ.previousLatencyCache.accessTime,
          ldata.accessTime)
        .toDuration().as("seconds");
    }
    div.querySelector(".update_interval").textContent = ldata.updateIntervalSeconds;
    const table = div.querySelector("table.latency");
    const tbody = table.querySelector("tbody");

    for (let host of HOST_LIST) {
      const th = table.querySelector(`th.${host}`);
      if (latencyServ.statsFailures.numForHost(host) === 0) {
        th.textContent = host;
        th.classList.remove("latency-conn-failure");
      } else {
        th.textContent = `${host} (${latencyServ.statsFailures.numForHost(host)} failures)`;
        th.classList.add("latency-conn-failure");
      }
    }

    ldata.latestData.forEach(ld => {
      let tr = tbody.querySelector(`tr.${ld.key}`);
      if (tr == null ) {
        tr = document.createElement("tr");
        tr.classList.add(ld.key);
        tr.innerHTML = `
          <td class="station">${ld.key}</td>
          <td class="cloud">${ld.velocity.cloud}</td>
          <td class="eeyore">${ld.velocity.eeyore}</td>
          <td class="iris">${ld.velocity.iris}</td>
        `;
        tr.innerHTML = `
        <tr>
          <td class="station"><a href="${import.meta.env.BASE_URL}heli/index.html?station=FDSN:${ld.key}">${ld.key}</a></td>

            ${createItemsForHost(ld, "eeyore")}
            ${createItemsForHost(ld, "cloud")}
            ${createItemsForHost(ld, "iris")}
          `;
        tbody.appendChild(tr);
      } else {
        for (let host of HOST_LIST) {
          const hostLd = ld[host];
          if (hostLd==null){continue;}
          let timeEl = tr.querySelector(`.latencytime.${host}`);
          timeEl.textContent = `${hostLd.end.toFormat('HH:mm:ss')}`;
          timeEl.classList.remove(LATENCY_BADBAD, LATENCY_BAD, LATENCY_WORRY, LATENCY_GOOD);
          timeEl.classList.add(latencySeriousness(hostLd.end))
          let textEl = tr.querySelector(`.latencytext.${host}`);
          textEl.textContent = `${latencyAsText(hostLd.end)}`;
          textEl.classList.remove(LATENCY_BADBAD, LATENCY_BAD, LATENCY_WORRY, LATENCY_GOOD);
          textEl.classList.add(latencySeriousness(hostLd.end))
        }

        tr.querySelector(".vel.cloud").textContent = `${ld.velocity.cloud.toFixed(2)}`;
        tr.querySelector(".velicon.cloud").textContent = latencyVelocityIcon(ld.velocity.cloud);
        tr.querySelector(".vel.eeyore").textContent = `${ld.velocity.eeyore.toFixed(2)}`;
        tr.querySelector(".velicon.eeyore").textContent = latencyVelocityIcon(ld.velocity.eeyore);
        tr.querySelector(".vel.iris").textContent = `${ld.velocity.iris.toFixed(2)}`;
        tr.querySelector(".velicon.iris").textContent = latencyVelocityIcon(ld.velocity.iris);
      }
    });
    return ldata;
  });

  setTimeout( () => {
    updateLatency().catch(r => {
      console.log(`Problem update latency, will try again... ${r}`);
    });
  }, latencyServ.updateInterval.toMillis());
  return latencyPromise;
}
updateLatency().catch(r => {
  console.log(`Initial update latency failed? ${r}`);
});

// table sorting from https://stackoverflow.com/questions/14267781/sorting-html-table-with-javascript
const getCellValue = (tr, idx) => tr.children[idx].innerText || tr.children[idx].textContent;

const comparer = (idx, asc) => (a, b) => ((v1, v2) =>
    v1 !== '' && v2 !== '' && !isNaN(v1) && !isNaN(v2) ? v1 - v2 : v1.toString().localeCompare(v2)
    )(getCellValue(asc ? a : b, idx), getCellValue(asc ? b : a, idx));

const table = document.querySelector("table.latency");
const thead = table.querySelector("thead");
const secHead = thead.querySelector("tr:nth-child(n+2)")
secHead.querySelectorAll('th').forEach(th => th.addEventListener('click', (() => {
    const table = th.closest('table');
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const descend = th.classList.contains("asc");
    th.classList.toggle("asc");
        rows.sort(comparer(Array.from(th.parentNode.children).indexOf(th), !descend));
        rows.forEach(tr => tbody.appendChild(tr) );
})));
