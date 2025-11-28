import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { task } from 'ember-concurrency';

import { variation } from 'ember-launch-darkly';

export default Component.extend({
  tagName: '',

  // Attributes
  language: null,
  list: null,
  canToggle: true,

  //services
  i18n: service(),
  toggleProperty: service(),
  locale: service(),
  metrics: service(),

  onToggle: task(function *() {
    let language = this.get('language');
    const notificationIntlKey = language.get('isPublic') ? 'admin.localization.disabled.message' : 'admin.localization.enabled.message';
    const successMessage = this.get('i18n').t(notificationIntlKey);
    if (variation('release-event-tracking')) {
      this.get('metrics').trackEvent({
        event: language.get('isPublic') ? 'localization_language_disabled' : 'localization_language_enabled',
        object: language.get('locale'),
        language: language.get('name')
      });
    }
    yield this.get('toggleProperty').toggleProperty(language, successMessage, 'isPublic');
  }).drop()
});
