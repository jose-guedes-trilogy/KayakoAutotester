import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import { task } from 'ember-concurrency';

export default Component.extend({
  session: service(),
  store: service(),
  notification: service(),
  i18n: service(),

  willDestroyElement() {
    this._rollbackPreferences();
  },

  preferences: computed(function() {
    return this.get('store').findAll('notification-preference', { reload: true });
  }),

  isEdited: computed('preferences.@each.hasDirtyAttributes', function() {
    return this.get('preferences').isAny('hasDirtyAttributes', true);
  }),

  save: task(function * () {
    const data = this.get('preferences').filterBy('hasDirtyAttributes').map(data => {
      return {
        notification_type: data.get('notificationType'),
        channel_desktop: data.get('channelDesktop'),
        channel_mobile: data.get('channelMobile'),
        channel_email: data.get('channelEmail')
      };
    });

    try {
      yield this.get('store')
        .adapterFor('notification-preference')
        .updatePreferences(data);

      this.get('notification').add({
        type: 'success',
        title: this.get('i18n').t('notifications.preferences.success'),
        autodismiss: true
      });

      this.get('onClose')();
    } catch (err) {
      this.get('notification').add({
        type: 'error',
        title: this.get('i18n').t('generic.generic_error'),
        autodismiss: true
      });
    }
  }),

  _rollbackPreferences() {
    this.get('preferences').forEach(preference => {
      preference.rollbackAttributes();
    });
  }
});
