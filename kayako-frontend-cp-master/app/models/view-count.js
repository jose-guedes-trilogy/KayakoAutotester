import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import { belongsTo } from 'ember-data/relationships';
import { computed } from '@ember/object';
import { equal } from '@ember/object/computed';

export default Model.extend({
  count: attr('number'),
  countAccuracy: attr('string'),
  realtimeChannel: attr('string'),
  view: belongsTo('view'),

  // CPs
  hasRelativeAccuracy: equal('countAccuracy', 'RELATIVE'),
  hasKnownAccuracy: computed('countAccuracy', function() {
    return this.get('countAccuracy') !== 'UNKNOWN';
  })
});
