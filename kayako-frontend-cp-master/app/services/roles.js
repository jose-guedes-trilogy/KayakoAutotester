import Service, { inject as service } from '@ember/service';
import EmberObject, { computed } from '@ember/object';

export default Service.extend({
  i18n: service(),

  editableSystemTypes: computed('allTypes', function() {
    return ['ADMIN', 'AGENT'].map((typeId) => {
      return this.get('allTypes').findBy('id', typeId);
    });
  }),

  allTypes: computed('i18n.locale', function() {
    return ['ADMIN', 'AGENT', 'COLLABORATOR', 'CUSTOMER', 'OWNER'].map((typeId) => {
      return EmberObject.create({
        id: typeId,

        label: this.get('i18n').t(
          `admin.roles.type.${typeId.toLowerCase()}`
        )
      });
    });
  }),

  availableTypes: computed('allTypes', function() {
    return this.get('allTypes').filter(function(type) {
      return ['ADMIN', 'AGENT'].includes(type.get('id'));
    });
  }),

  availableAgentCaseAccessTypes: computed('i18n.locale', function() {
    return ['ALL', 'TEAMS', 'SELF'].map((agentCaseAccessTypeId) => {
      return EmberObject.create({
        id: agentCaseAccessTypeId,

        label: this.get('i18n').t(
          `admin.roles.agent_case_access_type.${agentCaseAccessTypeId.toLowerCase()}`
        )
      });
    });
  })
});
