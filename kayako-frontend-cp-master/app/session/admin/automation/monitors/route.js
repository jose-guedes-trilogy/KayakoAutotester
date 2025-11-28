import { hash } from 'rsvp';
import Route from '@ember/routing/route';

export default Route.extend({
  model() {
    const store = this.get('store');

    return hash({
      definitions: store.query('definition', { type: 'monitor' }),
      automationActionDefinitions: store.query('automation-action-definition', { type: 'monitor' })
    });
  }
});
