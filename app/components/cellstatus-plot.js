import Component from '@ember/component';
import seisplotjs from 'ember-seisplotjs';

const d3 = seisplotjs.d3;
const DEFAULT_WIDTH=760;
const DEFAULT_HEIGHT=400;
const DEFAULT_DESTINATION="eeyore";
export default Component.extend({

  //margin: {top: 20, right: 20, bottom: 30, left: 40},
  //width: DEFAULT_WIDTH - this.margin.left - this.margin.right,
  //height: DEFAULT_HEIGHT - this.margin.top - this.margin.bottom,

  didInsertElement() {
    this._super(...arguments);
    this.setupStatusDisplay();
  },
  didUpdate() {
    this._super(...arguments);
    this.redisplay();
  },


  willDestroyElement() {
    this._super(...arguments);
    this.teardownSeisDisplay();
  },
  redisplay() {
    console.log("redisplay cellstatus-plot");
    let elementId = this.get('elementId');
    d3.select('#'+elementId).select('svg').remove();
    this.setupStatusDisplay();
  },

  setupStatusDisplay() {
    let margin= {top: 20, right: 20, bottom: 30, left: 40};
    let width= DEFAULT_WIDTH - margin.left - margin.right;
    let height= DEFAULT_HEIGHT - margin.top - margin.bottom;
    let elementId = this.get('elementId');
    let statusData = this.get('statusData');
    let start = this.get('start');
    let end = this.get('end');
    let plotkeys = this.get('plotkeys');
    console.log("statusData "+statusData);
    let allData = [];
    for (const cellStatus of statusData) {
      allData = allData.concat(cellStatus.get('values'));
    }
    if (allData.length == 0) {
      let svg = d3.select('#'+elementId).append('svg');
      svg.append('g').text("No Data");
      return;
    }
    // setup x
    let xValue = function(d) { return new Date(d.time);}; // data -> value
    let xScale = d3.scaleUtc().range([0, width]); // value -> display
    let xMap = function(d) { return xScale(xValue(d));}; // data -> display
    let xAxis = d3.axisBottom().scale(xScale);
    //xScale.domain([d3.min(allData, xValue), d3.max(allData, xValue)]);
    xScale.domain([start, end]);

    // setup y
    let plotConfig = this.setUpYValueFunctions(plotkeys, allData, height);


    let svg = d3.select('#'+elementId).append('svg');
    let svgG = svg.attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

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
      svgG.selectAll(".dot")
          .data(allData)
        .enter().append("circle")
          .attr("class", "dot")
          .attr("r", 3.5)
          .attr("cx", xMap)
          .attr("cy", plotConfig.yMap)
          .style("fill", function(d) { return plotConfig.color(plotConfig.cValue(d));})
  },
  teardownSeisDisplay() {
  },
  setUpYValueFunctions(plotkey, allData, height) {
    let out = {
      yValue: null,
      yScale: d3.scaleLinear().range([height, 0]),
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
      let latencyDest = this.get('destination') ? this.get('destination') : DEFAULT_DESTINATION;
      console.log("cellstatus-plot destination: "+latencyDest);
      out.yValue = function(d) { return (d.latency && d.latency[latencyDest]) ? d.latency[latencyDest] : -1;}; // data -> value
      //out.yScale.domain([d3.min(allData, out.yValue), d3.max(allData, out.yValue)]);
      let maxLatency = d3.max(allData, out.yValue);
      if (maxLatency <= 0) { maxLatency = 1;}
      out.yScale.domain([0, maxLatency]);
    } else {
      throw new Error("unknown plotkey: "+plotkey);
    }
    out.yMap = function(d) { return out.yScale(out.yValue(d));}; // data -> display
    out.yAxis = d3.axisLeft().scale(out.yScale);
    return out;
  }
});
