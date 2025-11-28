import Service from '@ember/service';

export default Service.extend({
  availableTypes: [
    { name: 'TEXT', nameIntlKey: 'admin.casefields.type.text.name', descriptionIntlKey: 'admin.casefields.type.text.description' },
    { name: 'TEXTAREA', nameIntlKey: 'admin.casefields.type.textarea.name', descriptionIntlKey: 'admin.casefields.type.textarea.description' },
    { name: 'RADIO', nameIntlKey: 'admin.casefields.type.radio.name', descriptionIntlKey: 'admin.casefields.type.radio.description' },
    { name: 'SELECT', nameIntlKey: 'admin.casefields.type.dropdown.name', descriptionIntlKey: 'admin.casefields.type.dropdown.description' },
    { name: 'CHECKBOX', nameIntlKey: 'admin.casefields.type.checkbox.name', descriptionIntlKey: 'admin.casefields.type.checkbox.description' },
    { name: 'NUMERIC', nameIntlKey: 'admin.casefields.type.numeric.name', descriptionIntlKey: 'admin.casefields.type.numeric.description' },
    { name: 'DECIMAL', nameIntlKey: 'admin.casefields.type.decimal.name', descriptionIntlKey: 'admin.casefields.type.decimal.description' },
    { name: 'YESNO', nameIntlKey: 'admin.casefields.type.yesno.name', descriptionIntlKey: 'admin.casefields.type.yesno.description' },
    { name: 'CASCADINGSELECT', nameIntlKey: 'admin.casefields.type.cascadingselect.name', descriptionIntlKey: 'admin.casefields.type.cascadingselect.description' },
    { name: 'DATE', nameIntlKey: 'admin.casefields.type.date.name', descriptionIntlKey: 'admin.casefields.type.date.description' },
    { name: 'REGEX', nameIntlKey: 'admin.casefields.type.regex.name', descriptionIntlKey: 'admin.casefields.type.regex.description' }
  ],

  getTypeByName(name) {
    return this.get('availableTypes').findBy('name', name);
  }
});
