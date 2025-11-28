import ApplicationSerializer from './application';

export default ApplicationSerializer.extend({
  attrs: {
    members: { serialize: false },
    memberCount: { serialize: false }
  },

  extractRelationships(modelClass, resourceHash) {
    resourceHash.links = {
      members: `/api/v1/teams/${resourceHash.id}/members`
    };

    return this._super(...arguments);
  }
});
