import { inject as service } from '@ember/service';
import Component from '@ember/component';

export default Component.extend({
  // Attributes
  account: null,
  editedAccount: null,

  // Events
  onCancel: null,
  onSave: null,
  onSuccess: null,

  // Services
  store: service()
});
