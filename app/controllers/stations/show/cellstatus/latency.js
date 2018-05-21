import Controller from '@ember/controller';

export default Controller.extend({
  actions: {
    goDestination(dest) {
      console.log('goDestination controller '+dest);
      // send action to route
      this.send('goDestinationOnRoute', dest, this.get('model').station.id);
//      this.set('destination', dest);

    }
  }
});
