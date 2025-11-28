import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { task } from 'ember-concurrency';
import jQuery from 'jquery';

export default Component.extend({
  value: null,

  session: service(),
  store: service(),
  notification: service(),
  i18n: service(),

  updateValue: task(function * () {
    this.toggleProperty('value');
    const value = this.get('value') ? '1' : '0';

    try {
      yield jQuery.ajax({
        url: '/api/v1/settings',
        headers: { 'X-CSRF-Token': this.get('session.csrfToken') },
        method: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify({ values: { 'cases.timetracking': value } })
      });

      this.get('notification').add({
        type: 'success',
        title: this.get('i18n').t('admin.apps.timetracking.notification', { isEnabled: value }),
        autodismiss: true
      });
    } catch (err) {
      this.get('notification').add({
        type: 'error',
        title: this.get('i18n').t('generic.generic_error'),
        autodismiss: true
      });
    }
  })
});
