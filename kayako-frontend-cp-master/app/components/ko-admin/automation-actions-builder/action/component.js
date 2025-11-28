import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import _ from 'npm:lodash';
import fallbackIfUndefined from 'ember-basic-dropdown/utils/computed-fallback-if-undefined';

export default Component.extend({
  tagName: '',
  type: '',
  currentAction: null,
  definition: null,
  definitions: fallbackIfUndefined([]),
  shouldGroupDefinitions: fallbackIfUndefined(false),
  showRemoveActionButton: fallbackIfUndefined(false),
  onRemoveAction() {},
  onChangeAction() {},

  i18n: service(),

  // CPs
  groupedDefinitions: computed('definitions.@each.id', function () {
    let { shouldGroupDefinitions, definitions } = this.getProperties('shouldGroupDefinitions', 'definitions');

    if (!shouldGroupDefinitions) {
      return definitions;
    }

    return _.map(
      _.groupBy(definitions.toArray(), definition => definition.get('group')),
      (options, group) => ({
        groupName: this.get('i18n').t(`admin.automation_actions_builder.group.${group}`),
        options: options.sort(option => option.label)
      })
    ).sort(group => group.groupBy);
  }),

  // Actions
  actions: {
    onRemoveAction(action, definition) {
      this.get('onRemoveAction')(action, definition);
    },

    onChangeAction(action, previousDefinition, selectedDefinition) {
      this.get('onChangeAction')(action, previousDefinition, selectedDefinition);
    }
  }
});
