import Controller from '@ember/controller';
import { computed } from '@ember/object';
import { sort } from '@ember/object/computed';
import { inject as service } from '@ember/service';

export default Controller.extend({
  modelSorting: ['isSystem:desc', 'title'],
  arrangedModel: sort('model', 'modelSorting'),
  plan: service(),

  // CPs
  needsPlanUpgrade: computed(function() {
    return !this.get('plan').has('custom_roles_and_permissions');
  }),

  // Actions
  actions: {
    transitionToNew() {
      this.transitionToRoute('session.admin.people.roles.new');
    },

    transitionToEdit(role) {
      this.transitionToRoute('session.admin.people.roles.edit', role.get('id'));
    }
  }
});
