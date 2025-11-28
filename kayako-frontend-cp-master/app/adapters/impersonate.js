import ApplicationAdapter from './application';

export default ApplicationAdapter.extend({
  impersonate(data) {
    let url = `${this.namespace}/impersonation/impersonate`;
    return this.ajax(url, 'POST', { data });
  }
});
