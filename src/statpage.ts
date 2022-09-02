import * as seisplotjs from 'seisplotjs';
import {loadCellStats, loadKilovaultStats, DataSOHType} from './jsonl_loader.js';
import {scatterplot} from './scatterplot.js';
import { DateTime} from 'luxon';

export function createStationCheckboxes(
      allStations: Array<string>,
      stationCallback: (string, boolean)=>void,
      lineColors: Array<string>,
    ) {
  const staSelector = 'div.stations';
  const stationsDiv = document.querySelector<HTMLDivElement>(staSelector);
  if (! stationsDiv) {
    throw new Error(`Can't find element with selector: ${staSelector}`)
  }
  let styleText = "";
  allStations.forEach((sta, idx) => {
    const div = stationsDiv.appendChild(document.createElement('span'));
    const cb = div.appendChild(document.createElement('input'));
    cb.setAttribute('type','checkbox');
    cb.setAttribute('checked','true');
    cb.setAttribute('name', sta);
    cb.addEventListener('click', event => {
      const checkbox = event.target as HTMLInputElement;
      stationCallback(sta, checkbox && checkbox.checked);
    });
    const nlabel = div.appendChild(document.createElement('label'));
    nlabel.setAttribute('class', sta);
    nlabel.textContent = sta;
    styleText = `${styleText}
    .${sta} {
      color: ${lineColors[idx]};
    }
    `;
  });
  const headEl = document.querySelector<HTMLElement>('head');
  if (! headEl) { throw new Error(`Can't find head element`);}
  const stationStyle = headEl.appendChild(document.createElement('style'));
  stationStyle.appendChild(document.createTextNode(styleText));

}
export function doPlot<Type>( selector: string,
                        allStats: Array<Type>,
                        keyFn: ((Type)=> string)|((Type)=> number),
                        selectedStations: Array<string>,
                        lineColors: Array<string>,
                      ) {
  let filtered = allStats.filter((stat: Type) => selectedStations.findIndex(s => s === stat.station) !== -1);
  let plotDiv = document.querySelector<HTMLDivElement>(selector);
  if (!plotDiv) {
    throw new Error(`Can't find element for selector '${selector}'`);
  }
  while (plotDiv.lastChild) {
    plotDiv.removeChild(plotDiv.lastChild);
  }
  if (filtered.length > 0) {
    scatterplot(selector, filtered, keyFn, selectedStations, lineColors);
  } else {
    let p = plotDiv.appendChild(document.createElement("p"));
    p.textContent = "No Data";
  }
}

export function createKeyCheckboxes(selector,
                                    statNames: Array<string>,
                                    curKey: string,
                                    callbackFn: (string)=>void
                                    ) {
  let keyDiv = document.querySelector<HTMLDivElement>(selector);
  if (!keyDiv) {
    throw new Error(`Can't find element for selecotor: ${selector}`);
  }
  statNames.forEach( key => {
    if (!keyDiv.querySelector(`span.${key}`)) {
      const div = keyDiv.appendChild(document.createElement('span'));
      div.setAttribute('class', key);
      const cb = div.appendChild(document.createElement('input'));
      cb.setAttribute('type','radio');
      cb.setAttribute('name', 'radiokey');
      if (curKey === key) {
        cb.setAttribute('checked', "true");
      }
      cb.addEventListener('click', () => {
        callbackFn(key);
      });
      const nlabel = div.appendChild(document.createElement('label'));
      nlabel.textContent = key;
    }
  });

}

export function initTimeChooser(duration: Duration, callbackFn: (Interval)=>void): seisplotjs.datechooser.TimeRangeChooser {
  let start = seisplotjs.luxon.DateTime.fromISO("2022-05-15");
  let end = start.plus(seisplotjs.luxon.Duration.fromObject({hours: 0, minutes: 5}));
  const timeChooser = document.querySelector<seisplotjs.datechooser.TimeRangeChooser>(seisplotjs.datechooser.TIMERANGE_ELEMENT);
  if (timeChooser) {
    timeChooser.duration = duration;
    const timerange = timeChooser.toInterval();
    start = timerange.start;
    end = timerange.end;
    let nowButton = document.querySelector<HTMLButtonElement>('#loadNow');
    if (nowButton) {
      nowButton.onclick = () => {
        timeChooser.end = seisplotjs.luxon.DateTime.utc();
      };
    }
    timeChooser.updateCallback = callbackFn;
  }
  return timeChooser;
}

export function createUpdatingClock() {
  const nowEl = document.querySelector<HTMLDivElement>("#nowtime");
  if (nowEl) {
    setInterval(() => {
      let n = seisplotjs.luxon.DateTime.utc().set({millisecond: 0});
      nowEl.textContent = `${n.toISO({suppressMilliseconds: true})} UTC`
    }, 1000);
  }
}
