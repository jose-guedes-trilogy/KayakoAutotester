import { attr, many, model } from 'frontend-cp/services/virtual-model';

const localeField = model('locale-field', {
  id: attr(),
  locale: attr(),
  translation: attr({ nonStrictMatching: true })
});

export default model('case-field', {
  isEnabled: attr(),
  title: attr(),
  tag: attr(),
  isRequiredForAgents: attr(),
  isRequiredOnResolution: attr(),
  isVisibleToCustomers: attr(),
  isCustomerEditable: attr(),
  isRequiredForCustomers: attr(),
  regularExpression: attr(),
  options: many(model('field-option', {
    id: attr(),
    fielduuid: attr(),
    values: many(localeField),
    tag: attr(),
    sortOrder: attr()
  })),
  customerTitles: many(localeField),
  descriptions: many(localeField)
});
