import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';

export default Component.extend({
  tagName: '',

  // Attributes
  model: null,
  isLoading: false,

  // Services
  i18n: service(),

  // CPs
  lastRepliedAt: computed('model.lastRepliedAt', 'model.lastReplier.fullName', function () {
    const i18n = this.get('i18n');
    const date = i18n.formatDate(this.get('model.lastRepliedAt'), { format: 'LLL' });
    return i18n.t('cases.last_reply_by_at', {
      by: this.get('model.lastReplier.fullName'),
      at: date
    });
  })
});
