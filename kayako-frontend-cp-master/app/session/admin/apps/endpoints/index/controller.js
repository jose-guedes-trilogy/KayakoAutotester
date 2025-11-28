import Controller from '@ember/controller';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';

export default Controller.extend({
  store: service(),
  confirmation: service(),
  i18n: service(),

  // CPs
  enabledEndpoints: computed('model.[]', 'model.@each.isEnabled', function() {
    return this.get('model').filter((endpoint) => endpoint.get('isEnabled'));
  }),

  disabledEndpoints: computed('model.[]', 'model.@each.isEnabled', function() {
    return this.get('model').filter((endpoint) => !endpoint.get('isEnabled'));
  }),

  // Actions
  actions: {
    transitionToSelectType() {
      this.transitionToRoute('session.admin.apps.endpoints.select-type');
    },
    editEndpoint(endpoint) {
      this.transitionToRoute('session.admin.apps.endpoints.edit', endpoint);
    },

    showErrorDetails(endpoint, e) {
      e.stopPropagation();
      this.transitionToRoute('session.admin.apps.endpoints.index.details', endpoint);
    },

    toggleEnabledStatus(endpoint, e) {
      e.stopPropagation();
      endpoint.toggleProperty('isEnabled');
      endpoint.save();
    },

    deleteEndpoint(endpoint, e) {
      e.preventDefault();
      e.stopPropagation();
      return this.get('confirmation').confirm({
        intlConfirmationBody: 'generic.confirm.delete'
      })
      .then(() => endpoint.destroyRecord());
    }
  }
});
