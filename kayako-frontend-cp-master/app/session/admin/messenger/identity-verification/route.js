import Route from '@ember/routing/route';
import RSVP from 'rsvp';

export default Route.extend({
  model() {
    const store = this.get('store');
    const tokens = store.findAll('device-token');

    return RSVP.hash({
      tokens
    });
  }
});
