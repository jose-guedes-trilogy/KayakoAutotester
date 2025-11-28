import EmberObject from '@ember/object';
import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import { alias } from '@ember/object/computed';
import { task } from 'ember-concurrency';
import { observer } from '@ember/object';

export default Component.extend({
  // HTML
  tagName: '',

  // Attributes
  field: null,
  editedField: null,
  title: null,
  onCancel: null,
  onSave: null,
  onDelete: null,
  onSystemOptionsEdit: () => {},
  agentCaseSettings: false,
  isCaseField: alias('agentCaseSettings'),
  isStatusKeyAvailable: true,
  isCustomerEditAvailable: true,
  isSystemOptionsEdited: false,
  schema: null,

  // Services
  customFields: service(),
  confirmation: service(),
  locale: service(),
  store: service(),
  virtualModel: service(),

  // CPs
  isApiFieldKeyAvailable: computed('field.id', function() {
    return !this.get('field.id');
  }),

  isStatusOrApiFieldAvailable: computed('isApiFieldKeyAvailable', 'isStatusKeyAvailable', function() {
    return this.get('isApiFieldKeyAvailable') || this.get('isStatusKeyAvailable');
  }),

  canBeDeleted: computed('field.isNew', 'field.isSystem', function() {
    let field = this.get('field');
    return !(field.get('isNew') || field.get('isSystem'));
  }),

  canBeVisibleByCustomers: computed('field', function() {
    const fieldModelName = this.get('field.constructor.modelName');
    return fieldModelName !== 'organization-field';
  }),

  onCustomerEditableChange: observer('field.isCustomerEditable', function() {
    if (!this.get('field.isCustomerEditable')) {
      this.set('field.isRequiredForCustomers', false);
    }
  }),

  isSystemField: computed('field.fieldType', function() {
    switch (this.get('field.fieldType')) {
      case 'SUBJECT':
      case 'PRIORITY':
      case 'STATUS':
      case 'TYPE':
      case 'TEAM':
      case 'ASSIGNEE':
        return true;
      default:
        return false;
    }
  }),

  isRequiredWhenCreatingEditable: computed('field.fieldType', function() {
    switch (this.get('field.fieldType')) {
      case 'SUBJECT':
        return false;
      default:
        return true;
    }
  }),

  isCustomerVisibleEditable: computed('field.fieldType', function() {
    switch (this.get('field.fieldType')) {
      case 'SUBJECT':
      case 'ASSIGNEE':
        return false;
      default:
        return true;
    }
  }),

  isCustomerFieldTitleEditable: computed('field.fieldType', function() {
    switch (this.get('field.fieldType')) {
      case 'SUBJECT':
      case 'MESSAGE':
        return false;
      default:
        return true;
    }
  }),

  isCustomerEditableEditable: computed('field.fieldType', function() {
    switch (this.get('field.fieldType')) {
      case 'SUBJECT':
      case 'TEAM':
      case 'ASSIGNEE':
        return false;
      default:
        return true;
    }
  }),

  isCustomerRequiredEditable: computed('field.fieldType', function() {
    switch (this.get('field.fieldType')) {
      case 'SUBJECT':
      case 'TEAM':
      case 'ASSIGNEE':
      case 'STATUS':
        return false;
      default:
        return true;
    }
  }),

  isCustomerDescriptionsVisible: computed('field.fieldType', function() {
    switch (this.get('field.fieldType')) {
      case 'TEAM':
      case 'ASSIGNEE':
        return false;
      default:
        return true;
    }
  }),

  customerTitleLocale: computed('editedField.customerTitles.[]', 'locale.accountDefaultLocaleCode', function () {
    const customerTitles = this.get('editedField.customerTitles');
    return customerTitles.findBy('locale', this.get('locale.accountDefaultLocaleCode'));
  }),

  descriptionLocale: computed('editedField.descriptions.[]', 'locale.accountDefaultLocaleCode', function () {
    const descriptions = this.get('editedField.descriptions');
    return descriptions.findBy('locale', this.get('locale.accountDefaultLocaleCode'));
  }),

  optionsSortOrder: ['sortOrder'],
  orderedOptionList: computed.sort('editedField.options', 'optionsSortOrder'),

  // Tasks
  save: task(function * () {
    try {
      const field = this.get('field');
      yield this.get('virtualModel').save(field, this.get('editedField'), this.get('schema'));
      field.get('customerTitles')
        .filter(customerTitle => customerTitle.get('isNew'))
        .forEach(customerTitle => customerTitle.unloadRecord());
      field.get('descriptions')
        .filter(description => description.get('isNew'))
        .forEach(description => description.unloadRecord());
      field.get('options')
        .filter(option => option.get('isNew'))
        .forEach(option => option.unloadRecord());
      field.get('options')
        .forEach(option => {
          option.get('values')
            .filter(value => value.get('isNew'))
            .forEach(value => value.unloadRecord());
        });
      this.get('onSave')();
    } catch (e) {
      // ignore errore
    }
  }).drop(),

  // Actions
  actions: {
    cancel() {
      this.get('onCancel')();
    },

    addOption() {
      const options = this.get('editedField.options');
      const maxSortOrder = Math.max(0, ...options.map(option => option.get('sortOrder')));

      const locales = this.get('store').peekAll('locale').filterBy('isPublic', true);

      options.pushObject(EmberObject.create({
        values: locales.map(locale => EmberObject.create({
          locale: locale.get('locale'),
          translation: '',
        })),
        sortOrder: maxSortOrder + 1
      }));
    },

    removeOption(option) {
      this.get('editedField.options').removeObject(option);
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

    reorderList(list) {
      let order = 1;
      list.forEach(option => {
        option.set('sortOrder', order);
        order++;
      });
    },

    deleteField() {
      const field = this.get('field');
      const translationPrefix = this.get('customFields').getTranslationPrefix(field.constructor.modelName);

      return this.get('confirmation').confirm({
        intlConfirmationBody: translationPrefix + '.labels.delete_confirmation',
        intlConfirmationHeader: translationPrefix + '.labels.confirm_delete',
        intlConfirmLabel: 'generic.confirm.delete_button'
      }).then(() => field.destroyRecord().then(() => this.get('onDelete')()));
    }
  }
});
