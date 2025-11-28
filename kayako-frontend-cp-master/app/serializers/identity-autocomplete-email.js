import ApplicationSerializer from './application';

export default ApplicationSerializer.extend({
  attrs: {
    user: { key: 'parent' }
  },

  normalizeResponse(store, primaryModelClass, payload, id, requestType) {
    if (!payload.data) {
      return this._super(...arguments);
    }

    // set parent model for identity record
    payload.data.forEach(record => {
      let type = record.identity.resource_type;
      let id = record.identity.id;

      let item = payload.resources[type][id];

      item.parent = {
        id: record.parent.id,
        resource_type: record.parent.resource_type
      };
      record.id = id;
      record.resource_type = 'identity_autocomplete_email';
    });

    payload.identity_autocomplete_email = payload.data;
    return this._super(...arguments);
  }
});
