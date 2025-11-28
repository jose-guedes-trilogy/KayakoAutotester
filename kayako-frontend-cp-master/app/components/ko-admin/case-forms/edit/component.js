import Component from '@ember/component';
import { computed } from '@ember/object';
import { task } from 'ember-concurrency';
import { inject as service } from '@ember/service';

export default Component.extend({
  // Params
  caseForm: null,
  caseFields: null,
  schema: null,
  editedCaseForm: null,
  title: null,
  onCancel: () => {},
  onDelete: () => {},
  onSuccess: () => {},

  // Services
  confirmation: service(),
  virtualModel: service(),
  locale: service(),

  canBeDeleted: computed('caseForm.isNew', 'caseForm.isDefault', function() {
    return !(this.get('caseForm.isNew') || this.get('caseForm.isDefault'));
  }),

  brandsWithPlaceholder: computed('brands.[]', function() {
    return [''].concat(this.get('brands').toArray());
  }),

  customerTitleLocale: computed('editedCaseForm.customerTitle', 'editedCaseForm.customerTitles.[]', 'locale.accountDefaultLocaleCode', function () {
    const customerTitles = this.get('editedCaseForm.customerTitles');
    return customerTitles.findBy('locale', this.get('locale.accountDefaultLocaleCode'));
  }),

  descriptionLocale: computed('editedCaseForm.description', 'editedCaseForm.descriptions.[]', 'locale.accountDefaultLocaleCode', function () {
    const descriptions = this.get('editedCaseForm.descriptions');
    return descriptions.findBy('locale', this.get('locale.accountDefaultLocaleCode'));
  }),

  save: task(function * () {
    let caseForm = this.get('caseForm');

    yield this.get('virtualModel').save(this.get('caseForm'), this.get('editedCaseForm'), this.get('schema'));

    caseForm.get('customerTitles')
      .filter(customerTitle => customerTitle.get('isNew'))
      .forEach(customerTitle => customerTitle.unloadRecord());
    caseForm.get('descriptions')
      .filter(description => description.get('isNew'))
      .forEach(description => description.unloadRecord());

    this.get('onSuccess')();
  }).drop(),

  actions: {
    cancel() {
      this.get('onCancel')();
    },

    addCaseFieldToForm(caseField) {
      this.get('editedCaseForm.fields').pushObject(caseField);
    },

    removeCaseFieldFromForm(caseField) {
      this.get('editedCaseForm.fields').removeObject(caseField);
    },

    updateFields(fields) {
      this.set('editedCaseForm.fields', fields);
    },

    setCustomerTitle(translation) {
      const customerTitleLocale = this.get('customerTitleLocale');

      if (customerTitleLocale) {
        customerTitleLocale.set('translation', translation);
      }
    },

    setDescription(translation) {
      const descriptionLocale = this.get('descriptionLocale');

      if (descriptionLocale) {
        descriptionLocale.set('translation', translation);
      }
    },

    deleteForm() {
      return this.get('confirmation').confirm({
        intlConfirmLabel: 'generic.confirm.delete_button',
        intlConfirmationBody: 'admin.caseforms.confirm_delete.body',
        intlConfirmationHeader: 'admin.caseforms.confirm_delete.title'
      }).then(() => {
        const formId = this.get('caseForm.id');
        return this.get('caseForm').destroyRecord().then(() => {
          this.get('onDelete')(formId);
        });

      });
    }
  }
});
