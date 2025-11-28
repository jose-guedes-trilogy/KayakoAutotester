import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { task, timeout } from 'ember-concurrency';

export default Component.extend({
  tagName: '',

  // Attributes
  requester: null,
  isKREEdited: false,
  isErrored: false,
  isEdited: false,
  isDisabled: false,
  onValueChange: null,

  // Services
  store: service(),

  // Tasks
  search: task(function * (name) {
    yield timeout(300);
    return yield this.get('store').query('user', { name });
  })
});
