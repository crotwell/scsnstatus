import Component from '@ember/component';
import seisplotjs from 'ember-seisplotjs';

const d3 = seisplotjs.d3;
const DEFAULT_WIDTH=560;
const DEFAULT_HEIGHT=400
export default Component.extend({

  //margin: {top: 20, right: 20, bottom: 30, left: 40},
  //width: DEFAULT_WIDTH - this.margin.left - this.margin.right,
  //height: DEFAULT_HEIGHT - this.margin.top - this.margin.bottom,

  didInsertElement() {
    this._super(...arguments);
    this.setupStatusDisplay();
  },

  willDestroyElement() {
    this._super(...arguments);
    this.teardownSeisDisplay();
  },

  setupStatusDisplay() {
    let margin= {top: 20, right: 20, bottom: 30, left: 40};
    let width= DEFAULT_WIDTH - margin.left - margin.right;
    let height= DEFAULT_HEIGHT - margin.top - margin.bottom;
    let elementId = this.get('elementId');
    let statusData = this.get('statusData');
    console.log("statusData "+statusData);
    let allData = [];
    for (const cellStatus of statusData) {
    console.log("cellStatus.values[0]: "+cellStatus.get('values')[0]+"  "+" "+cellStatus.get('values')[0].time);
      allData = allData.concat(cellStatus.get('values'));
    }
    console.log("allData[0]: "+allData[0]+"  "+" "+allData[0].time);
    // setup x
    let xValue = function(d) { return new Date(d.time);}; // data -> value
    let xScale = d3.scaleUtc().range([0, width]); // value -> display
    let xMap = function(d) { return xScale(xValue(d));}; // data -> display
    let xAxis = d3.axisBottom().scale(xScale);

    // setup y volt
    let yVoltValue = function(d) { return d.volt;}; // data -> value
    let yVoltScale = d3.scaleLinear().range([height, 0]); // value -> display
    let yVoltMap = function(d) { return yVoltScale(yVoltValue(d));}; // data -> display
    let yVoltAxis = d3.axisLeft().scale(yVoltScale);

    // setup y rssi
    let yRssiValue = function(d) { return d.netrssi;}; // data -> value
    let yRssiScale = d3.scaleLinear().range([height, 0]); // value -> display
    let yRssiMap = function(d) { return yRssiScale(yRssiValue(d));}; // data -> display
    let yRssiAxis = d3.axisLeft().scale(yRssiScale);

    // just yVolts
  //  let yValue = yVoltValue
//    let yScale = yVoltScale
//    let yMap = yVoltMap
//    let yAxis = yVoltAxis

    // just yRssi
    let yValue = yRssiValue
    let yScale = yRssiScale
    let yMap = yRssiMap
    let yAxis = yRssiAxis

    // setup fill color
    let cValue = function(d) { return "blabla";};
    let color = d3.scaleOrdinal(d3.schemeCategory10);

    xScale.domain([d3.min(allData, xValue), d3.max(allData, xValue)]);
    yRssiScale.domain([d3.min(allData, yRssiValue)-5, d3.max(allData, yRssiValue)+5]);
    yVoltScale.domain([11, 15]);
console.log('yRssi domain: '+yRssiScale.domain());

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
          .call(yAxis)
        .append("text")
          .attr("class", "label")
          .attr("transform", "rotate(-90)")
          .attr("y", 6)
          .attr("dy", ".71em")
          .style("text-anchor", "end")
          .text("Volts");

      // draw dots
      svgG.selectAll(".dot")
          .data(allData)
        .enter().append("circle")
          .attr("class", "dot")
          .attr("r", 3.5)
          .attr("cx", xMap)
          .attr("cy", yMap)
          .style("fill", function(d) { return color(cValue(d));})
  },
  teardownSeisDisplay() {
  },

});
