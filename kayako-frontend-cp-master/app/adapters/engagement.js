import ApplicationAdapter from './application';

export default ApplicationAdapter.extend({
  pathForType() {
    return 'engagements';
  },
  reorderEngagements(data) {
    let url = `${this.namespace}/${this.pathForType()}/reorder`;
    return this.ajax(url, 'PUT', { data });
  },
  updateStatus(engagementId, data) {
    let url = `${this.namespace}/${this.pathForType()}/${engagementId}`;
    return this.ajax(url, 'PUT', { data });
  }
});
