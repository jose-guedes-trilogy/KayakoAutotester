import Component from '@ember/component';
import { computed } from '@ember/object';
import parseSummary from 'frontend-cp/utils/parse-summary';
import { inject as service } from '@ember/service';

export default Component.extend({
  tagName: '',
  model: null,
  activity: null,

  store: service(),

  // Methods
  getUserFromToken(token) {
    const id = token.url.match(/[0-9]+$/)[0];
    return this.get('store').peekRecord('user', id);
  },

  // CPs
  activityBelongsToCase: computed.bool('activity.kase.id'),
  tokens: computed('summary', function() {
    const summary = this.get('summary');
    if (!summary) { return []; }
    return parseSummary(summary) || [];
  })
});
