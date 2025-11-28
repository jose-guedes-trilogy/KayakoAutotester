import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { task } from 'ember-concurrency';

export default Component.extend({
  store: service(),
  notification: service('notification'),
  i18n: service(),

  init() {
    this._super(...arguments);
    this.set('editingSignature', this.get('currentUser.signature'));
  },

  updateSignature: task(function * () {
    let userId = this.get('currentUser.id');
    let signature = this.get('editingSignature');
    try {
      yield this.get('store').adapterFor('user').updateSignature(userId, signature);
      this.get('onClose')();
      this.get('notification').add({
        type: 'success',
        title: this.get('i18n').t('generic.changes_saved'),
        autodismiss: true
      });
      this.get('onUpdate')();
    } catch (e) {
      this.get('notification').add({
        type: 'error',
        title: this.get('i18n').t('generic.generic_error'),
        autodismiss: true
      });
    }
  }).drop(),

  actions: {
    editSignature(signature) {
      this.set('editingSignature', signature);
    }
  }
});
