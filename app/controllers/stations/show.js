import Controller from '@ember/controller';

export default Controller.extend({
  actions: {
    changeStation(station_id, plotname) {
      // send action to route
      this.send('changeStationOnRoute', station_id, plotname);
    }
  }
});
