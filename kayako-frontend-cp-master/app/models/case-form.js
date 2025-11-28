import { not } from '@ember/object/computed';
import { isPresent } from '@ember/utils';
import { computed } from '@ember/object';
import DS from 'ember-data';

export default DS.Model.extend({
  title: DS.attr('string', { defaultValue: '' }),
  customerTitle: DS.attr('string', { defaultValue: '' }),
  description: DS.attr('string', { defaultValue: '' }),
  isVisibleToCustomers: DS.attr('boolean'),
  isEnabled: DS.attr('boolean', { default: true }),
  isDeleted: DS.attr('boolean', { default: false }),
  isDefault: DS.attr('boolean', { default: false }),
  sortOrder: DS.attr('number'),
  fields: DS.hasMany('case-field', { async: false }),
  brand: DS.belongsTo('brand', { async: false }),
  createdAt: DS.attr('date'),
  updatedAt: DS.attr('date'),

  customerTitles: DS.hasMany('locale-field', { async: false }),
  descriptions: DS.hasMany('locale-field', { async: false }),

  canBeDisabled: computed('id', 'isDefault', function() {
    return isPresent(this.get('id')) && !this.get('isDefault');
  }),

  canBeMadeDefault: not('isDefault'),
  canBeDeleted: not('isDefault')
});
