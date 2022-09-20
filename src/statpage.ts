import * as seisplotjs from 'seisplotjs';
import {scatterplot} from './scatterplot.js';
import {DataSOHType} from './jsonl_loader.js';
import { Duration, Interval } from 'luxon';


export function createStationCheckboxes(
      allStations: Array<string>,
      stationCallback: (sta: string, sel: boolean)=>void,
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
export function doPlot<Type extends DataSOHType>( selector: string,
                        allStats: Array<Type>,
                        keyFn: ((d:Type)=> string)|((d:Type)=> number),
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
export function doText<Type extends DataSOHType>( selector: string,
                        allStats: Array<Type>,
                        keyFn: ((d:Type)=> string)|((d:Type)=> number),
                        selectedStations: Array<string>,
                    //    lineColors: Array<string>,
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
    let s = "";
    filtered.filter(d => keyFn(d)!==0).forEach(d => s=`${s}\n${d.station} ${d.time}  ${keyFn(d)}`);
    plotDiv.textContent = s;
  } else {
    let p = plotDiv.appendChild(document.createElement("p"));
    p.textContent = "No Data";
  }
}

export function createKeyCheckboxes(selector: string,
                                    statNames: Array<string>,
                                    curKey: string,
                                    callbackFn: (k: string)=>void
                                    ) {
  const keyDiv = document.querySelector<HTMLDivElement>(selector);
  if (keyDiv) {
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
  } else {
    throw new Error(`Can't find element for selecotor: ${selector}`);
  }


}

export function initTimeChooser(duration: Duration,
                                callbackFn: (interval: Interval)=>void
                              ): seisplotjs.datechooser.TimeRangeChooser {
  const timeChooser = document.querySelector<seisplotjs.datechooser.TimeRangeChooser>(seisplotjs.datechooser.TIMERANGE_ELEMENT);
  if (timeChooser) {
    timeChooser.duration = duration;
    let nowButton = document.querySelector<HTMLButtonElement>('#loadNow');
    if (nowButton) {
      nowButton.onclick = () => {
        timeChooser.end = seisplotjs.luxon.DateTime.utc();
      };
    }
    let todayButton = document.querySelector<HTMLButtonElement>('#loadToday');
    if (todayButton) {
      todayButton.onclick = () => {
        timeChooser.end = seisplotjs.luxon.DateTime.utc();
        timeChooser.duration = seisplotjs.luxon.Duration.fromISO("P1D");
      };
    }
    timeChooser.updateCallback = callbackFn;
    return timeChooser;
  } else {
    throw new Error(`Can't find TimeRangeChooser by selector ${seisplotjs.datechooser.TIMERANGE_ELEMENT}`);
  }
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

export function timesort<Type extends DataSOHType>(a: Type, b: Type): number {
  return a.time < b.time ? -1 : a.time > b.time ? 1 : 0;
}
