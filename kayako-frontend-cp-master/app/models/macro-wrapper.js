import EmberObject from '@ember/object';
import { computed } from '@ember/object';
import { observer } from '@ember/object';
import actionHandlers from 'frontend-cp/components/ko-admin/macros/edit/action-handlers';

export default EmberObject.extend({
  store: null,
  macro: null,
  macroActions: null,

  title: computed.alias('macro.title'),
  visibleToTeam: computed.alias('macro.visibleToTeam'),
  visibilityType: computed.alias('macro.visibilityType'),
  errors: computed.alias('macro.errors'),

  init() {
    this._super(...arguments);

    let macro = this.get('macro');

    let actions = Object.keys(actionHandlers).reduce((actions, actionType) => {
      let handler = actionHandlers[actionType];

      if (handler) {
        handler.deserialize(macro, actions);
      }

      return actions;
    }, []);


    let newMacroActions = macro.get('actions');
    if (newMacroActions) {
      newMacroActions.forEach(m => {
        actions.push({
          name: m.get('name'),
          option: m.get('option'),
          value: m.get('value')
        });
      });
    }

    if (actions.length === 0) {
      actions.push({});
    }

    this.set('macroActions', actions);
  },

  updateProperties: observer('macroActions.@each.{name,option,value}', function() {
    let { macro, macroActions, store } = this.getProperties('macro', 'macroActions', 'store');

    macroActions.reduce((m, action) => {
      let handler = actionHandlers[action.name];

      if (handler) {
        return handler.serialize(action, m, store);
      }

      return m;
    }, macro);
  }),

  addAction() {
    this.get('macroActions').pushObject({});
  },

  removeAction(action) {
    this._handleActionRemoval(action.name);
    this.get('macroActions').removeObject(action);
  },

  changeAction(definition) {
    this._handleActionRemoval(definition.name);
  },

  _handleActionRemoval(name) {
    if (name) {
      let macro = this.get('macro');
      let handler = actionHandlers[name];

      if (handler) {
        handler.reset(macro);
      }
    }
  }
});
