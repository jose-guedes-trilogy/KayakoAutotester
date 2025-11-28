import { not } from '@ember/object/computed';
import { computed } from '@ember/object';
import DS from 'ember-data';

export default DS.Model.extend({
  isPrimary: DS.attr('boolean'),
  isValidated: DS.attr('boolean'),

  // CPs
  canBeRemoved: not('isPrimary'),
  canBeValidated: not('isValidated'),
  canBePrimarized: computed('isPrimary', 'canBeValidated', function() {
    return !this.get('isPrimary') && !this.get('canBeValidated');
  })
});

