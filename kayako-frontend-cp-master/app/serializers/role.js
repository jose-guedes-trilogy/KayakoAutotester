import ApplicationSerializer from './application';

export default ApplicationSerializer.extend({
  extractRelationships(modelClass, resourceHash) {
    resourceHash.links = { permissions: 'permissions' };
    return this._super(...arguments);
  }
});
