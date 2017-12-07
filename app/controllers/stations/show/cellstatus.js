import Controller from '@ember/controller';

export default Controller.extend({
  actions: {
    refresh() {
      this.get('model').cellstatus.forEach(cs => {
        cs.reload();
      });
    }
  }
});
