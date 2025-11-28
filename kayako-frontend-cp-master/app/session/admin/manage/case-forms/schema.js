import { attr, many, model } from 'frontend-cp/services/virtual-model';

const localeField = model('locale-field', {
  id: attr(),
  locale: attr(),
  translation: attr({ nonStrictMatching: true })
});

export default model('case-form', {
  title: attr(),
  customerTitle: attr(),
  description: attr(),
  isVisibleToCustomers: attr(),
  isEnabled: attr(),
  fields: many(attr()),
  brand: attr(),

  customerTitles: many(localeField),
  descriptions: many(localeField)
});
