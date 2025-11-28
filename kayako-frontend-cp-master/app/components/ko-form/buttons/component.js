import { oneWay } from '@ember/object/computed';
import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import KoForm from '../component';
import fallbackIfUndefined from 'frontend-cp/lib/computed-fallback-if-undefined';

export default Component.extend({
  // Params
  submitLabel: null,
  cancelLabel: null,
  deleteLabel: null,
  onCancel: null,
  onSubmit: null,
  isValid: true,
  onDelete: null,
  isSaving: false,
  cancelButtonClass: fallbackIfUndefined('qa-ko-form_buttons__cancel'),
  submitClass: fallbackIfUndefined('qa-ko-form_buttons__submit'),

  i18n: service(),

  koForm: computed(function () {
    return this.nearestOfType(KoForm);
  }),

  // TODO depracate and replace with isSaving
  isSubmitting: oneWay('koForm.isSubmitting'),

  actions: {
    deleteAction() {
      if (this.get('koForm')) {
        this.set('koForm.isSubmitting', true);
      }
      this.get('onDelete')().finally(result => {
        if (this.get('koForm')) {
          this.set('koForm.isSubmitting', false);
        }
      });
    }
  }
});
