import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';

export default Model.extend({
  label: attr('string'),
  name: attr('string'),
  options: attr(),
  inputType: attr('string'),
  valueType: attr('string'),
  values: attr(),
  attributes: attr(),
  group: attr('string'),
  // Services
  i18n: service(),

  // CPs
  groupLabel: computed('label', 'group', function() {
    let { group, label } = this.getProperties('group', 'label');

    if (group) {
      return this.get('i18n').t(`admin.automation_actions_builder.group.${group}`) + ': ' + label;
    }

    return label;
  }),

  valuesSortedAphabetically: computed('values', function() {
    return this.get('values').sortBy('value');
  })
});
