import Component from '@glimmer/component';
import { action } from '@ember/object';

import seisplotjs from 'seisplotjs';
import moment from 'moment';

const d3 = seisplotjs.d3;
const DEFAULT_WIDTH=760;
const DEFAULT_HEIGHT=400;
const DEFAULT_DEST_LIST=[ "eeyore", "thecloud", "iris"];
const DEFAULT_DESTINATION="eeyore";
const CLIP_PREFIX = "PLOT_CLIP";
const KEY_Y_SHIFT = 20;
const KEY_X_SHIFT = 20;

export default class CellStatusPlotComponent extends Component {

  @action
  createGraph(element) {
    this.setupStatusDisplay(element);
  }
  @action
  updateGraph(element) {
    this.setupStatusDisplay(element);
  }
  setupStatusDisplay(element) {
    let margin= {top: 20, right: 20, bottom: 30, left: 60};
    let width= DEFAULT_WIDTH - margin.left - margin.right;
    let height= DEFAULT_HEIGHT - margin.top - margin.bottom;
    let voltData = this.args.voltData;
    let prevVoltData = this.args.prevVoltData;
    d3.select(element).select('svg').remove();

    // setup x
    let xValue = function(d) { return d.jday;}; // data -> value
    let xScale = d3.scaleLinear().range([0, width]); // value -> display
    let xMap = function(d) { return xScale(xValue(d));}; // data -> display
    let xAxis = d3.axisBottom().scale(xScale);
    //xScale.domain([d3.min(allData, xValue), d3.max(allData, xValue)]);
    xScale.domain([0, 366]);
    // setup y
    let plotConfig = this.setUpYValueFunctions("Voltage", voltData.volt, height);

    let plotMaxConfig = this.setUpYValueFunctions("Voltage", voltData.volt, height);
    plotMaxConfig.yValue = function(d) { return d.max;}; // data -> value

    let year = "2021";

    let svg = d3.select(element).append('svg');
    let svgG = svg.attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        // clip rect
        // check if clip exists, wonky d3 convention
      const CLIP_ID = CLIP_PREFIX;
      let container = svg.select("defs").select("#"+CLIP_ID);
      if (container.empty()) {
        svg.append("defs").append("clipPath").attr("id", CLIP_ID);
      }
      let clip = svg.select("defs").select("#"+CLIP_ID);

      clip.selectAll("rect").remove();
      clip.append("rect")
            .attr("width", width)
            .attr("height", height);
        // x-axis
      svgG.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + height + ")")
          .call(xAxis)
      svgG.append("g")
          .attr("class", "x axislabel")
      .attr("transform", "translate(0," + height + ")")
      .append("text")
          .attr("class", "label")
          .attr("x", width/2)
          .attr("y", margin.bottom)
          .style("text-anchor", "end")
          .style("fill", "black")
          .text("Day of Year");

      // y-axis
      svgG.append("g")
          .attr("class", "y axis")
          .call(plotConfig.yAxis);
      let svgText = svg.append("g")
               .classed("yLabel", true)
               .attr("x", 0)
               .attr("transform", `translate(0, ${(margin.top+(height)/2)})`)
               .append("text");
      svgText.classed("y label", true);
        // vertical
        svgText
          .attr("text-anchor", "middle")
          .attr("dy", ".75em")
          .attr("transform", "rotate(-90, 0, 0)")
          .text(plotConfig.yAxisLabel);

      // horizontal grid lines
      svg.append("g").classed("gridlines", true)
        .selectAll("line.horizontalGrid").data(plotConfig.yScale.ticks()).enter()
        .append("line")
        .classed("horizontalGrid",true)
        .attr("x1", margin.left)
        .attr("x2", margin.left+width)
        .attr("y1", function(d){ return margin.top+plotConfig.yScale(d);})
        .attr("y2", function(d){ return margin.top+plotConfig.yScale(d);})
        .attr("fill", "none")
        .attr("shape-rendering", "crispEdges")
        .attr("stroke", "lightgrey")
        .attr("stroke-width", "1px");

      // draw dots prev year

      let pdotsG = svgG.append("g").classed(`year_${year-1}`, true);
      pdotsG.attr("style", "clip-path: url(#"+CLIP_ID+")")
      pdotsG.selectAll(".dot")
          .data(prevVoltData.volt)
        .enter().append("circle")
          .attr("class", "dot")
          .attr("r", 3.5)
          .attr("cx", xMap)
          .attr("cy", plotConfig.yMap)
          .style("fill", "lightblue")
      let maxpdotsG = svgG.append("g").classed(`year_${year-1}`, true);
      maxpdotsG.attr("style", "clip-path: url(#"+CLIP_ID+")")
      maxpdotsG.selectAll(".dot")
          .data(prevVoltData.volt)
        .enter().append("circle")
          .attr("class", "dot")
          .attr("r", 3.5)
          .attr("cx", xMap)
          .attr("cy", plotMaxConfig.yMap)
          .style("fill", "lightpink");


      // draw dots curr year
      let dotsG = svgG.append("g").classed(`year_${year}`, true);
      dotsG.attr("style", "clip-path: url(#"+CLIP_ID+")")
      dotsG.selectAll(".dot")
          .data(voltData.volt)
        .enter().append("circle")
          .attr("class", "dot")
          .attr("r", 3.5)
          .attr("cx", xMap)
          .attr("cy", plotConfig.yMap)
          .style("fill", function(d) { return plotConfig.color(plotConfig.cValue(d));})
      let maxdotsG = svgG.append("g").classed(`year_${year}`, true);
      maxdotsG.attr("style", "clip-path: url(#"+CLIP_ID+")")
      maxdotsG.selectAll(".dot")
          .data(voltData.volt)
        .enter().append("circle")
          .attr("class", "dot")
          .attr("r", 3.5)
          .attr("cx", xMap)
          .attr("cy", plotMaxConfig.yMap)
          .style("fill", "red");

  }

  teardownSeisDisplay() {
  }
  setUpYValueFunctions(plotkey, allData, height) {
    let out = {
      yValue: null,
      yScale: d3.scaleLinear().range([height, 0]).nice(),
      yMap: null,
      yAxis: null,
      cValue: function(d, i) { return plotkey;},
      color: d3.scaleOrdinal(d3.schemeCategory10),
      yAxisLabel: plotkey
    };
    // setup y volt
    out.yValue = function(d) { return d.min;}; // data -> value
    out.yScale.domain([11, 15]);
    out.yMap = function(d) { return out.yScale(out.yValue(d));}; // data -> display
    out.yAxis = d3.axisLeft().scale(out.yScale);
    return out;
  }

}
