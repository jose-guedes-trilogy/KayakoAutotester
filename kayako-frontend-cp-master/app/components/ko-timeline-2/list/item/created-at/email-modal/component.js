import Component from '@ember/component';
import { task } from 'ember-concurrency';
import { inject as service } from '@ember/service';
import { get } from '@ember/object';
import copy from 'frontend-cp/lib/copy-to-clipboard';

export default Component.extend({
  tagName: '',

  email: null,
  errorType: null,

  store: service(),
  errorHandler: service(),
  notification: service(),
  i18n: service(),

  onClose: () => {},

  init() {
    this._super(...arguments);

    this.get('fetchEmailContents').perform();
  },

  fetchEmailContents: task(function * () {
    let { store, model } = this.getProperties('store', 'model');

    yield this.get('errorHandler').disableWhile(() => {
      return store.findRecord('email-original', get(model, 'id'))
        .then(email => {
          this.set('email', email);
        }, ({ errors }) => {
          if (errors && errors[0] && errors[0].code === 'RESOURCE_NOT_FOUND') {
            this.set('errorType', 404);
          } else {
            this.set('errorType', 500);
          }
        });
    });
  }),

  actions: {
    copyToClipboard(text) {
      copy(text.replace(/<br \/>/g,''));

      this.get('notification').add({
        type: 'success',
        title: this.get('i18n').t('generic.copied_to_clipboard'),
        autodismiss: true
      });
    }
  }
});
