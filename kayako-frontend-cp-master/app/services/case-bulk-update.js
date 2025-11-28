import { Promise as EmberPromise } from 'rsvp';
import Service from '@ember/service';
import { getOwner } from '@ember/application';
import { variation } from 'ember-launch-darkly';

export default Service.extend({

  trashCases(caseIds) {
    const adapter = getOwner(this).lookup('adapter:application');
    const adapterNamespace = adapter.get('namespace');
    const url = `${adapterNamespace}/cases/trash?ids=${caseIds.toString()}`;

    return adapter.ajax(url, 'PUT', {data: {state: 'TRASH'}});
  },

  updateCases(caseIds, options) {
    const adapter = getOwner(this).lookup('adapter:application');
    const adapterNamespace = adapter.get('namespace');
    const url = `${adapterNamespace}/cases?ids=${caseIds.toString()}`;
    const payload = {};

    if (!Object.keys(options) || !Object.keys(options).length) {
      return new EmberPromise((resolve) => { return resolve(); });
    } else {
      if (typeof options.assignedTeam !== 'undefined') {
        payload.assigned_team_id = options.assignedTeam.id ? options.assignedTeam.id : null;
        payload.assigned_agent_id = options.assignedAgent ? options.assignedAgent.id : null;
      }

      if (typeof options.caseStatus !== 'undefined') {
        payload.status_id = options.caseStatus.id;
      }

      if (typeof options.casePriority !== 'undefined') {
        if (options.casePriority) {
          payload.priority_id = options.casePriority.id;
        } else {
          payload.priority_id = options.casePriority;
        }
      }
      if (typeof options.caseType !== 'undefined') {
        if (options.caseType) {
          payload.type_id = options.caseType.id;
        } else {
          payload.type_id = options.caseType;
        }
      }
      if (typeof options.tags !== 'undefined' && options.tags.length > 0) { payload.tags = options.tags.map((tag) => { return tag.name; }).toString(); }

      if (variation('release-sidebar-custom-fields')) {
        if (options.fieldValues) {
          payload.field_values = options.fieldValues;
        }
      }

      return adapter.ajax(url, 'PUT', {data: payload});
    }
  }
});
