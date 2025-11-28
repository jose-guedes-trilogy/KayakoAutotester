import Service, { inject as service } from '@ember/service';

export default Service.extend({
  i18n: service(),
  store: service(),
  customFieldsTypes: service('custom-fields/types'),
  sorter: service(),

  getTitleBreadcrumbs(model) {
    let title = [];
    const type = this.get('customFieldsTypes').getTypeByName(model.get('fieldType'));
    const stateModifier = model.get('isNew') ? 'new' : 'edit';

    title.push(this._getTranslation(this.getTranslationPrefix(model.constructor.modelName) + '.title'));

    if (model.get('title')) {
      title.push(model.get('title'));
    } else if (type) {
      title.push(this._getTranslation(type.nameIntlKey));
      title.push(this._getTranslation('admin.fields.' + stateModifier + '.heading'));
    }

    return title.join(' / ');
  },

  ensureLocaleFieldsAndOptions(model) {
    const store = this.get('store');
    const locales = store.peekAll('locale').filterBy('isPublic', true);
    const customerTitles = model.get('customerTitles');
    const descriptions = model.get('descriptions');
    const options = model.get('options');

    if (this.isChoiceField(model) && options.get('length') === 0) {
      options.pushObject(store.createRecord('field-option'));
    }

    locales.forEach(element => {
      const locale = element.get('locale');

      if (!customerTitles.findBy('locale', locale)) {
        customerTitles.pushObject(store.createRecord('locale-field', { locale }));
      }

      if (!descriptions.findBy('locale', locale)) {
        descriptions.pushObject(store.createRecord('locale-field', { locale }));
      }

      options.forEach(option => {
        if (!option.get('values').findBy('locale', locale)) {
          option.get('values').pushObject(store.createRecord('locale-field', { locale }));
        }
      });
    });
  },

  reorder(_, models) {
    this.get('sorter').sort(models);
  },

  toggleEnabled(field) {
    field.toggleProperty('isEnabled');
    return field.save();
  },

  isChoiceField(field) {
    switch (field.get('fieldType')) {
      case 'RADIO':
      case 'CHECKBOX':
      case 'CASCADINGSELECT':
      case 'SELECT':
        return true;

      default:
        return false;
    }
  },

  baseTypeKeyForFieldType(fieldType) {
    switch (fieldType) {
      case 'SUBJECT':
      case 'TEXT':
        return 'admin.casefields.type.text.name';

      case 'MESSAGE':
      case 'TEXTAREA':
        return 'admin.casefields.type.textarea.name';

      case 'PRIORITY':
      case 'STATUS':
      case 'TYPE':
      case 'ASSIGNEE':
      case 'TEAM':
      case 'SELECT':
      case 'DROPDOWN':
        return 'admin.casefields.type.dropdown.name';

      case 'RADIO':
        return 'admin.casefields.type.radio.name';
      case 'CHECKBOX':
        return 'admin.casefields.type.checkbox.name';
      case 'NUMERIC':
        return 'admin.casefields.type.numeric.name';
      case 'DECIMAL':
        return 'admin.casefields.type.decimal.name';
      case 'FILE':
        return 'admin.casefields.type.file.name';
      case 'YESNO':
        return 'admin.casefields.type.yesno.name';
      case 'CASCADINGSELECT':
        return 'admin.casefields.type.cascadingselect.name';
      case 'DATE':
        return 'admin.casefields.type.date.name';
      case 'REGEX':
        return 'admin.casefields.type.regex.name';
    }
  },

  baseKeyForFieldType(fieldType) {
    switch (fieldType) {
      case 'SUBJECT':
        return 'TEXT';

      case 'MESSAGE':
        return 'TEXTAREA';

      case 'PRIORITY':
      case 'STATUS':
      case 'TYPE':
      case 'ASSIGNEE':
      case 'TEAM':
        return 'SELECT';
      default:
        return fieldType;
    }
  },

  getTranslationPrefix(typeKey) {
    if (typeKey === 'case-field') {
      return 'admin.casefields';
    } else if (typeKey === 'user-field') {
      return 'admin.userfields';
    } else if (typeKey === 'organization-field') {
      return 'admin.organizationfields';
    }
  },

  _getTranslation(key) {
    return this.get('i18n').t(key);
  }
});
