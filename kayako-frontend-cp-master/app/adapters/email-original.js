import ApplicationAdapter from './application';

export default ApplicationAdapter.extend({
  urlForFindRecord(id, _modelName, _snapshot) {
    let baseUrl = this.buildURL();
    return `${baseUrl}/cases/posts/${id}/email_original`;
  }
});
