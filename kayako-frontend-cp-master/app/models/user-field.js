import DS from 'ember-data';

export default DS.Model.extend({
  fielduuid: DS.attr('string'),
  title: DS.attr('string', { defaultValue: '' }),
  fieldType: DS.attr('string'),
  key: DS.attr('string'),
  isVisibleToCustomers: DS.attr('boolean', { defaultValue: false }),
  customerTitles: DS.hasMany('locale-field', { async: false }),
  isCustomerEditable: DS.attr('boolean', { defaultValue: false }),
  isRequiredForCustomers: DS.attr('boolean', { defaultValue: false }),
  descriptions: DS.hasMany('locale-field', { async: false }),
  regularExpression: DS.attr('string', { defaultValue: '' }),
  sortOrder: DS.attr('number'),
  isEnabled: DS.attr('boolean', { defaultValue: true }),
  options: DS.hasMany('field-option', { async: false }),
  createdAt: DS.attr('date'),
  updatedAt: DS.attr('date')
});
