import ApplicationAdapter from './application';

export default ApplicationAdapter.extend({
  urlForQuery(query, modelName) {
    if (query.user_id) {
      const url = `${this.namespace}/users/${query.user_id}/organizations`;
      // Remove user_id from query params since it's in URL path
      delete query.user_id;
      return url;
    }
    return this._super(...arguments);
  },
  
  urlForUpdateRecord(id, modelName, snapshot) {
    const userId = snapshot.record.get('user.id') || (snapshot.adapterOptions && snapshot.adapterOptions.userId);
    if (userId) {
      const organizationId = snapshot.record.get('organization.id');
      return `${this.namespace}/users/${userId}/organizations/${organizationId}`;
    }
    return this._super(...arguments);
  },
  
  urlForDeleteRecord(id, modelName, snapshot) {
    const userId = snapshot.record.get('user.id') || (snapshot.adapterOptions && snapshot.adapterOptions.userId);
    if (userId) {
      const organizationId = snapshot.record.get('organization.id');
      return `${this.namespace}/users/${userId}/organizations/${organizationId}`;
    }
    return this._super(...arguments);
  },
  
  urlForCreateRecord(modelName, snapshot) {
    const userId = snapshot.record.get('user.id') || (snapshot.adapterOptions && snapshot.adapterOptions.userId);
    if (userId) {
      return `${this.namespace}/users/${userId}/organizations`;
    }
    return this._super(...arguments);
  }
});
