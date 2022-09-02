import * as sp from 'seisplotjs';
import {DataSOHType} from './jsonl_loader';
const d3 = sp.d3;

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
                            lineColors
                          ) {

  // set the dimensions and margins of the graph
  const div_element = document.querySelector(selector);
  if (! div_element) {
    throw new Error(`Can't find element by selector: '${selector}'`);
  }
  const rect = div_element.getBoundingClientRect();
  let margin = {top: 10, right: 30, bottom: 30, left: 130};
  let width = rect.width - margin.left - margin.right;
  let height = rect.height - margin.top - margin.bottom;

  // append the svg object to the body of the page
  const svg = d3.select(selector)
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
  const x = d3.scaleUtc()
    .domain([start, end])
    .range([ 0, width ])
    .nice();
  svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));

  // Add Y axis
  let y;
  let yNumberScale = null;
  let yOrdinalScale = null;
  if (numberData) {
    console.log(`numberData`)
    yNumberScale = d3.scaleLinear()
      .domain([min, max])
      .range([ height, 0]).nice()
      .nice();
    y = yNumberScale;
  } else {
    console.log(`ord Data`)
    yOrdinalScale = d3.scalePoint()
      .domain(allOrdinalVals)
      .range([ height, 0]);
    y = yOrdinalScale;
  }
  svg.append("g")
    .call(d3.axisLeft(y));

  const color = d3.scaleOrdinal()
    .domain(allStations)
    .range(lineColors.slice(0, allStations.length));


  const highlight = function({}, d: DataSOHType){
    d3.selectAll(".dot")
      .transition()
      .duration(200)
      .style("fill", "lightgrey")
      .attr("r", 3)

    d3.selectAll("." + d.station)
      .transition()
      .duration(200)
      .style("fill", color(d.station))
      .attr("r", 7)
  }

  const doNotHighlight = function(event, d){
    d3.selectAll(".dot")
      .transition()
      .duration(200)
      .style("fill", d => color(d.station))
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
      .style("fill", function (d) { return color(d.station) } )
    .on("mouseover", highlight)
    .on("mouseleave", doNotHighlight )


}
