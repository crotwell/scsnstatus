import Component from '@glimmer/component';
import { action } from '@ember/object';

import seisplotjs from 'seisplotjs';
import moment from 'moment';

const d3 = seisplotjs.d3;
const DEFAULT_WIDTH=760;
const DEFAULT_HEIGHT=400;
const DEFAULT_DESTINATION="eeyore";
const CLIP_PREFIX = "PLOT_CLIP";

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
    let statusData = this.args.cellStatusData;
    let start = moment(this.args.start);
    let end = moment(this.args.end);
    let plotkeys = this.args.plotkeys;
    let allData = [];
    if (statusData) {
      for (const cellStatus of statusData) {
        allData = allData.concat(cellStatus.values);
      }
    }
    d3.select(element).select('svg').remove();
    
    if (allData.length == 0) {
      let svg = d3.select(element).append('svg');
      svg.append('g').text("No Data");
      return;
    } else {

      if (plotkeys === 'volts') {
        allData = allData.filter( d => d.volt && d.volt != 0);
      } else if (plotkeys === 'rssi') {
        allData = allData.filter( d => d.netrssi && d.netrssi != -200);
      } else if (plotkeys.startsWith('latency')) {
        const latencyDest = this.destination ? this.destination : DEFAULT_DESTINATION;
        allData = allData.filter( d => d.latency && d.latency[latencyDest]);
      }
      allData = allData.filter(d => {
        const dtime = moment.utc(d.time);
        return start.isSameOrBefore(dtime) && end.isSameOrAfter(dtime);
      });
    }
    // setup x
    let xValue = function(d) { return moment.utc(d.time).toDate();}; // data -> value
    let xScale = d3.scaleTime().range([0, width]).nice(); // value -> display
    let xMap = function(d) { return xScale(xValue(d));}; // data -> display
    let xAxis = d3.axisBottom().scale(xScale);
    //xScale.domain([d3.min(allData, xValue), d3.max(allData, xValue)]);
    xScale.domain([moment(start).toDate(), moment(end).toDate()]);
    // setup y
    let plotConfig = this.setUpYValueFunctions(plotkeys, allData, height);


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
        .append("text")
          .attr("class", "label")
          .attr("x", width)
          .attr("y", -6)
          .style("text-anchor", "end")
          .text("Time");

      // y-axis
      svgG.append("g")
          .attr("class", "y axis")
          .call(plotConfig.yAxis)
        .append("text")
          .attr("class", "label")
          .attr("transform", "rotate(-90)")
          .attr("y", 6)
          .attr("dy", ".71em")
          .style("text-anchor", "end")
          .text(plotConfig.yAxisLabel);

      // draw dots
      const dotKeys = [];
      if (plotkeys.startsWith('latency')) {
        dotKeys.push(plotkeys);
      } else {
        dotKeys.push(plotkeys);
      }
      for (let dk of dotKeys) {
        let dotsG = svgG.append("g").classed(dk, true);
        dotsG.attr("style", "clip-path: url(#"+CLIP_ID+")")
        dotsG.selectAll(".dot")
            .data(allData)
          .enter().append("circle")
            .attr("class", "dot")
            .attr("r", 3.5)
            .attr("cx", xMap)
            .attr("cy", plotConfig.yMap)
            .style("fill", function(d) { return plotConfig.color(plotConfig.cValue(d));})
      }
  }

  teardownSeisDisplay() {
  }
  setUpYValueFunctions(plotkey, allData, height) {
    let out = {
      yValue: null,
      yScale: d3.scaleLinear().range([height, 0]).nice(),
      yMap: null,
      yAxis: null,
      cValue: function(d) { return plotkey;},
      color: d3.scaleOrdinal(d3.schemeCategory10),
      yAxisLabel: plotkey
    };
    if (plotkey === 'volts') {
      // setup y volt
      out.yValue = function(d) { return d.volt;}; // data -> value
      out.yScale.domain([11, 15]);
    } else if (plotkey === 'rssi') {
      // setup y rssi
      out.yValue = function(d) { return d.netrssi;}; // data -> value
      out.yScale.domain([d3.min(allData, out.yValue)-5, d3.max(allData, out.yValue)+5]);
    } else if (plotkey.startsWith('latency')) {
      // setup y latency
      let latencyDest = this.destination ? this.destination : DEFAULT_DESTINATION;
      out.yValue = function(d) { return (d.latency && d.latency[latencyDest]) ? d.latency[latencyDest] : Number.NaN;}; // data -> value
      //out.yScale.domain([d3.min(allData, out.yValue), d3.max(allData, out.yValue)]);
      let maxLatency = d3.max(allData, out.yValue);
      if (maxLatency <= 0) { maxLatency = 1;}
      out.yScale.domain([0, maxLatency*1.05]);
    } else {
      throw new Error("unknown plotkey: "+plotkey);
    }
    out.yMap = function(d) { return out.yScale(out.yValue(d));}; // data -> display
    out.yAxis = d3.axisLeft().scale(out.yScale);
    return out;
  }

}
