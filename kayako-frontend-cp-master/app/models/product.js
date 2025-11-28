import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import { belongsTo, hasMany } from 'ember-data/relationships';
import { computed } from '@ember/object';
import { alias, not } from '@ember/object/computed';

export default Model.extend({
  family: attr('string'),
  features: attr(),
  name: attr('string'),
  plan: belongsTo(),
  productType: attr('string'),
  rateplans: hasMany('product-rateplan'),

  isLatest: computed('family', 'productType', function() {
    let family = this.get('family');
    let productType = this.get('productType');

    return family === productType;
  }),

  isCurrent: alias('isLatest'),
  isLegacy: not('isLatest')
});
