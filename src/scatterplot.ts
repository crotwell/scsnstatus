import * as sp from 'seisplotjs';
const d3 = sp.d3;

export function scatterplot(selector: string, data: Array<any>, key: string, allStations: Array<string>, lineColors: Array<Color>) {

// set the dimensions and margins of the graph
const div_element = document.querySelector(selector);
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

let start = data[0]['time'];
let end = data[0]['time'];
let min = 99999999;
let max = -99999999;
let numberData = data.length > 1 && sp.util.isDef(data[1][key]) && typeof data[1][key] === 'number' ;
for (let i=0; i<5; i++) {
  console.log(`${i}  ${data[i][key]}  ${typeof data[i][key]}  ${Number.isNaN(data[1][key])}`)
}
let allOrdinalVals = [];
if (numberData) {
  data.forEach(d => {
    if (d[key] < min) { min = d[key];}
    if (d[key] > max) { max = d[key];}
    if (d['time'] < start) { start = d['time'];}
    if (d['time'] > end) { end = d['time'];}
  });
} else {
  console.log(`ord data first: ${data[0][key]}  ${Number.isNaN(data[0][key])}  key: ${key}`)
  let valList = new Set();
  data.forEach(d => {
    valList.add(d[key]);
    if (d['time'] < start) { start = d['time'];}
    if (d['time'] > end) { end = d['time'];}
  });
  allOrdinalVals = Array.from(valList.values())
  min = 0;
  max = allOrdinalVals.length-1;
  console.log(`all ords: ${allOrdinalVals}  min: ${min} max: ${max}`)
}
console.log(`plot ${key} from ${start} to ${end},  amp: ${min} - ${max}`);

  // Add X axis
  var x = d3.scaleUtc()
    .domain([start, end])
    .range([ 0, width ])
    .nice();
  svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));

  // Add Y axis
  let y;
  if (numberData) {
    console.log(`numberData`)
    y = d3.scaleLinear()
      .domain([min, max])
      .range([ height, 0]).nice()
      .nice();
  } else {
    console.log(`ord Data`)
    y = d3.scalePoint()
      .domain(allOrdinalVals)
      .range([ height, 0]);
  }
  svg.append("g")
    .call(d3.axisLeft(y));

  // Color scale: give me a specie name, I return a color
  var color = d3.scaleOrdinal()
    .domain(allStations)
    .range(lineColors.slice(0, allStations.length));


  // Highlight the specie that is hovered
  const highlight = function(event, d){
console.log(`highlight ${d.station} ${d}`)
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

  // Highlight the specie that is hovered
  var doNotHighlight = function(event, d){
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
      .attr("cy", function (d) { return y(d[key]); } )
      .attr("r", 5)
      .style("fill", function (d) { return color(d.station) } )
    .on("mouseover", highlight)
    .on("mouseleave", doNotHighlight )


}
