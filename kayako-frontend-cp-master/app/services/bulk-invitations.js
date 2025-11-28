import Service from '@ember/service';

export default Service.extend({
  emails: [],

  reset() {
    this.set('emails', []);
  }
});
