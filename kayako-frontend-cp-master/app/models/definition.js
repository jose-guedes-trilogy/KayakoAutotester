import { inject as service } from '@ember/service';
import DS from 'ember-data';
import MF from 'ember-data-model-fragments';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';


export default DS.Model.extend({
  i18n: service(),

  fieldName: reads('id'),
  label: DS.attr('string'),
  group: DS.attr('string'),
  definitionType: DS.attr('string'),
  inputType: DS.attr('string'),
  subType: DS.attr('string'),
  operators: DS.attr('array'),

  groupLabel: computed('label', 'group', function() {
    let group = this.get('group');
    let label = this.get('label');

    if (group) {
      return this.get('i18n').t(`admin.predicate_builder.group.${group}`) + ': ' + label;
    }

    return label;
  }),

  // Can be one of the following things:
  // * an empty string
  // * an object with keys as value and properties as text
  // * a unicorn
  values: MF.fragmentArray('definition-value-fragment')
});
