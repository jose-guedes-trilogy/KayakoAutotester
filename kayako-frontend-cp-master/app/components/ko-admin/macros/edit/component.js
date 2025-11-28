import { readOnly } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import Component from '@ember/component';
import schema from 'frontend-cp/lib/macro-schema';
import { computed } from '@ember/object';

export default Component.extend({
  macro: null,
  editedMacro: null,
  title: null,
  referenceData: null,

  onCancel() {},
  onSuccess() {},

  i18n: service(),
  notification: service(),
  virtualModel: service(),

  teams: computed.alias('referenceData.teams'),
  selectedTeam: readOnly('editedMacro.visibleToTeam'),

  init() {
    this._super(...arguments);

    if (!this.get('referenceData')) {
      this.set('referenceData', {});
    }
  },

  actions: {
    addAction() {
      this.get('editedMacro').addAction();
    },

    removeAction(action) {
      this.get('editedMacro').removeAction(action);
    },

    changeAction(action, previousDefinition) {
      if (previousDefinition) {
        this.get('editedMacro').changeAction(previousDefinition);
      }
    },

    saveMacro() {
      const macro = this.get('macro');
      const editedMacro = this.get('editedMacro.macro');

      // Handle new macro actions
      const macroActions = this.get('editedMacro.macroActions'); 
      const newMacroActionNames = ['subject', 'brand', 'mailbox', 'clear_tags', 'change_tags'];
      const newMacroActions = macroActions.filter(action => 
        newMacroActionNames.includes(action.name) || action.name.startsWith('customfield_')
      );
      editedMacro.set('actions', newMacroActions);

      return this.get('virtualModel').save(macro, editedMacro, schema)
        .catch((error) => {
          if (error && error.errors.findBy('code', 'ANY_FIELD_REQUIRED')) {
            this.get('notification').add({
              type: 'error',
              title: this.get('i18n').t('admin.macros.errors.actions.required'),
              autodismiss: true,
              dismissable: true
            });
          }

          throw error;
        });
    },

    setMacroSharing(sharing) {
      let macro = this.get('editedMacro');

      switch (sharing) {
        case 'PRIVATE':
          macro.set('visibleToTeam', null);
          macro.set('visibilityType', 'PRIVATE');
          break;
        case 'ALL':
          macro.set('visibleToTeam', null);
          macro.set('visibilityType', 'ALL');
          break;
        case 'TEAM':
          macro.set('visibilityType', 'TEAM');
          break;
      }
    },

    selectTeam(team) {
      this.get('editedMacro').set('visibleToTeam', team);
    }
  }
});
