import Component from '@ember/component';
import { inject as service } from '@ember/service';

export default Component.extend({
  // Attributes
  page: null,
  editedPage: null,

  // Events
  onCancel: null,
  onSave: null,
  onSuccess: null,

  // Services
  store: service()
});
