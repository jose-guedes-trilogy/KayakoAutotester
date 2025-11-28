import ApplicationSerializer from './application';

export default ApplicationSerializer.extend({
  normalizeResponse(store, primaryModelClass, payload, id, requestType) {
    if (payload.data) {
      if (Array.isArray(payload.data)) {
        payload.data.forEach(item => {
          if (Array.isArray(item.actions)) {
            item.actions = item.actions.map(action => {
              const actionId = action.id;
              return payload.resources.macro_action[actionId];
            });
          }
        });
      } else {
        if (Array.isArray(payload.data.actions)) {
          payload.data.actions = payload.data.actions.map(action => {
            const actionId = action.id;
            return payload.resources.macro_action[actionId];
          });
        }
      }
    }

    return this._super(...arguments);
  },
  extractRelationships(modelClass, resourceHash) {
    let agent = resourceHash.assignee && resourceHash.assignee.agent;
    let team = resourceHash.assignee && resourceHash.assignee.team;
    let caseType = resourceHash.macro_type;

    if (agent) {
      resourceHash.assigned_agent = { id: agent.id, type: agent.resource_type };
    }
    if (team) {
      resourceHash.assigned_team = { id: team.id, type: team.resource_type };
    }
    if (caseType) {
      resourceHash.case_type = { id: caseType.id, type: caseType.resource_type };
    }

    if (resourceHash.visibility && resourceHash.visibility.team) {
      resourceHash.visible_to_team = resourceHash.visibility.team;
    }

    Reflect.deleteProperty(resourceHash, 'type');
    return this._super(...arguments);
  },

  extractAttributes(modelClass, resourceHash) {
    if (resourceHash.assignee) {
      resourceHash.assignee_type = resourceHash.assignee.type;
    }

    if (resourceHash.visibility && resourceHash.visibility.type) {
      resourceHash.visibility_type = resourceHash.visibility.type;
    }

    return this._super(...arguments);
  },

  serialize(snapshot, options) {
    let json = this._super(...arguments);
    if (!json.assignee_type) {
      Reflect.deleteProperty(json, 'assignee_type');
    }

    json.type_id = json.case_type_id;
    Reflect.deleteProperty(json, 'case_type_id');

    return json;
  }
});
