import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import { computed } from '@ember/object';

export default Model.extend({
  category: attr('string'),
  name: attr('string'),
  isProtected: attr('boolean'),
  value: attr('string'),

  // CPs
  toBoolean: computed('value', function () {
    return this.get('value') === '1';
  }),

  key: computed('name', 'category', function () {
    return this.get('category') + '.' + this.get('name');
  })
});
