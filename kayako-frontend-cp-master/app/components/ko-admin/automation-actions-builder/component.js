import Component from '@ember/component';
import { not } from '@ember/object/computed';
import { computed, setProperties, get } from '@ember/object';
import { inject as service } from '@ember/service';
import fallbackIfUndefined from 'ember-basic-dropdown/utils/computed-fallback-if-undefined';
import { without } from 'ember-composable-helpers/helpers/without';

export default Component.extend({
  classNames: ['ko-automation-actions-builder'],

  type: '',
  addAction() {},
  removeAction() {},
  changeAction() {},

  automationActions: fallbackIfUndefined([]),
  definitions: fallbackIfUndefined([]),
  shouldGroupDefinitions: fallbackIfUndefined(true),
  usedDefinitions: null,

  i18n: service(),

  // Lifecycle Hooks
  init() {
    this._super(...arguments);

    let actionNames = this.get('automationActions').map(action => action.name);

    let usedDefinitions = this.get('definitions').filter(definition => {
      return actionNames.indexOf(definition.get('name')) > -1;
    });

    this.set('usedDefinitions', usedDefinitions);
  },


  // CPs
  availableDefinitions: computed('definitions.[]', 'usedDefinitions.[]', function() {
    let definitions = this.get('definitions');
    let usedDefinitions = this.get('usedDefinitions');

    return without(usedDefinitions, definitions);
  }),
  actionsAreExclusive: not('shouldGroupDefinitions'),
  showAddActionButton: computed('actionsAreExclusive', 'automationActions.length', function() {
    let actionsAreExclusive = this.get('actionsAreExclusive');
    let actionCount = this.get('automationActions.length');
    let definitionCount = this.get('definitions.length');

    if (!actionsAreExclusive) {
      return true;
    }

    return actionCount < definitionCount;
  }),

  actions: {
    onRemoveAction(action, definition) {
      let actionsAreExclusive = this.get('actionsAreExclusive');
      let usedDefinitions = this.get('usedDefinitions');

      if (actionsAreExclusive && definition) {
        usedDefinitions.removeObject(definition);
      }

      this.get('removeAction')(action);
    },

    onChangeAction(action, previousDefinition, selectedDefinition) {
      let actionsAreExclusive = this.get('actionsAreExclusive');
      let usedDefinitions = this.get('usedDefinitions');

      if (actionsAreExclusive) {
        if (previousDefinition) {
          usedDefinitions.removeObject(previousDefinition);
        }
        usedDefinitions.pushObject(selectedDefinition);
      }

      setProperties(action, {
        name: get(selectedDefinition, 'name'),
        option: null,
        value: null
      });

      this.get('changeAction')(action, previousDefinition);
    }
  }
});
