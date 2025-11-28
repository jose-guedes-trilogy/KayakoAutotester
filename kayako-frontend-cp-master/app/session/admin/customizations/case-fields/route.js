import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default Route.extend({
  casePriorityCache: service('cache/case-priority'),

  activate() {
    this._super(...arguments);
    this.get('casePriorityCache').invalidateCache();
  }
});
