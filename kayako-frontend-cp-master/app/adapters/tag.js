import ApplicationAdapter from './application';

export default ApplicationAdapter.extend({
  urlForQuery(query, modelName) {
    let urlParts = [this.urlPrefix()];
    if (query.caseId) {
      urlParts.push(`cases/${query.caseId}/tags`);
      Reflect.deleteProperty(query, 'caseId');
    }
    else if (query.userId) {
      urlParts.push(`users/${query.userId}/tags`);
      Reflect.deleteProperty(query, 'userId');
    }
    else if (query.organizationId) {
      urlParts.push(`organizations/${query.organizationId}/tags`);
      Reflect.deleteProperty(query, 'organizationId');
    }
    else {
      urlParts.push('autocomplete/tags');
    }
    return urlParts.join('/');
  }
});
