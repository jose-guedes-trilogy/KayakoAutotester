import ApplicationAdapter from './application';

export default ApplicationAdapter.extend({
  pathForType() {
    return 'devices/tokens';
  },
  updateToken(type) {
    let url = `${this.namespace}/${this.pathForType()}`;
    return this.ajax(url, 'PUT', {
      data: {
        type
      }
    });
  }
});
