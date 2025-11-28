import { readOnly } from '@ember/object/computed';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import DS from 'ember-data';

export default DS.Model.extend({
  fielduuid: DS.attr('string'),
  values: DS.hasMany('locale-field', { async: false }),
  tag: DS.attr('string'),
  sortOrder: DS.attr('number', { default: 1 }),
  createdAt: DS.attr('date'),
  updatedAt: DS.attr('date'),

  parent: DS.belongsTo('any', { polymorphic: true, async: true }),

  // Services
  locale: service(),

  // CPs
  valueLocale: computed('values.[]', 'locale.accountDefaultLocaleCode', function () {
    return this.get('values').findBy('locale', this.get('locale.accountDefaultLocaleCode'));
  }),

  value: readOnly('valueLocale.translation')
});
