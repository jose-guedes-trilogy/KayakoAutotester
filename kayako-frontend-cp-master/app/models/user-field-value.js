import DS from 'ember-data';
import MF from 'ember-data-model-fragments';
import { on } from '@ember/object/evented';
import { observer } from '@ember/object';

export default MF.Fragment.extend({
  fieldId: DS.attr('string'),

  observeFieldID: on('init', observer('fieldId', function () {
    this.set('field', this.store.peekRecord('user-field', this.get('fieldId')));
  })),

  value: DS.attr('string')
});
