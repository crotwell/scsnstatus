import * as sp from 'seisplotjs';
import {
  select as d3_select,
  selectAll as d3_selectAll,
} from "d3-selection";
import "d3-transition";
import {
  scaleUtc as d3_scaleUtc,
  scaleLinear as d3_scaleLinear,
  scalePoint as d3_scalePoint,
} from "d3-scale";
import {
  axisBottom as d3_axisBottom,
  axisTop as d3_axisTop,
  axisLeft as d3_axisLeft,
  axisRight as d3_axisRight,
} from "d3-axis";


// export function scatterplot(selector: string,
//                             data: Array<DataSOHType>,
//                             keyFn: ((d:DataSOHType)=> string)|((d:DataSOHType)=> number),
//                             allStations: Array<string>,
//                             lineColors: Array<string>
//                           ) {
export function scatterplot(selector,
                            data,
                            keyFn,
                            allStations,
                            colorForStation
                          ) {

  // set the dimensions and margins of the graph
  const div_element = document.querySelector(selector);
  if (! div_element) {
    throw new Error(`Can't find element by selector: '${selector}'`);
  }
  const rect = div_element.getBoundingClientRect();
  let margin = {top: 30, right: 130, bottom: 30, left: 130};
  let width = rect.width - margin.left - margin.right;
  let height = rect.height - margin.top - margin.bottom;

  // append the svg object to the body of the page
  const svg = d3_select(selector)
    .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

  let start = data[0].time;
  let end = data[0].time;
  let min = 99999999;
  let max = -99999999;
  let dataWithKey = data.find(d => sp.util.isDef(keyFn(d)));
  let numberData = dataWithKey && typeof keyFn(dataWithKey) === 'number' ;
  let allOrdinalVals = [];
  if (numberData) {
    console.log(`is numberData`);
    data.forEach(d => {
      const v = keyFn(d);
      if (v) {
        if (v < min) { min = v;}
        if (v > max) { max = v;}
        if (d['time'] < start) { start = d['time'];}
        if (d['time'] > end) { end = d['time'];}
      }
    });
    if (min === max) {
      min = min-1;
      max = max+1;
    }
  } else {
    console.log(`is string Data`)
    let valList = new Set();
    data.forEach(d => {
      const v = keyFn(d);
      console.log(v)
      if (v) {
        valList.add(`${v}`);
        if (d['time'] < start) { start = d['time'];}
        if (d['time'] > end) { end = d['time'];}
      }
    });
    allOrdinalVals = Array.from(valList.values())
    min = 0;
    max = allOrdinalVals.length-1;
  }

  // Add X axis
  const x = d3_scaleUtc()
    .domain([start, end])
    .range([ 0, width ])
    .nice();
  svg.append("g")
    .call(d3_axisTop(x));
  svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3_axisBottom(x));

  // Add Y axis
  let y;
  let yNumberScale = null;
  let yOrdinalScale = null;
  if (numberData) {
    console.log(`numberData`)
    yNumberScale = d3_scaleLinear()
      .domain([min, max])
      .range([ height, 0]).nice()
      .nice();
    y = yNumberScale;
  } else {
    console.log(`ord Data`)
    yOrdinalScale = d3_scalePoint()
      .domain(allOrdinalVals)
      .range([ height, 0]);
    y = yOrdinalScale;
  }
  svg.append("g")
    .call(d3_axisLeft(y));

  svg.append("g")
    .attr("transform", `translate(${width}, 0)`)
    .call(d3_axisRight(y));


  const highlight = function({}, d){
    d3_selectAll(".dot")
      .transition()
      .duration(200)
      .style("fill", "lightgrey")
      .attr("r", 3)

    d3_selectAll("." + d.station)
      .transition()
      .duration(200)
      .style("fill", colorForStation.get(d.station))
      .attr("r", 7)
  }

  const doNotHighlight = function(event, d){
    d3_selectAll(".dot")
      .transition()
      .duration(200)
      .style("fill", d => colorForStation.get(d.station))
      .attr("r", 5 )
  }

  // Add dots
  svg.append('g')
    .selectAll("dot")
    .data(data)
    .enter()
    .append("circle")
      .attr("class", function (d) { return "dot " + d.station } )
      .attr("cx", function (d) { return x(d['time'].toJSDate()); } )
      .attr("cy", function (d) { return y(keyFn(d)) })
      .attr("r", 5)
      .style("fill", function (d) { return colorForStation.get(d.station) } )
    .on("mouseover", highlight)
    .on("mouseleave", doNotHighlight )


}
