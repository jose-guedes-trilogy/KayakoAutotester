import ApplicationAdapter from './application';

export default ApplicationAdapter.extend({
  pathForType(modelName) {
    return 'atlasai';
  },

  register() {
    return this.ajax('/api/v1/atlasai/register', 'POST');
  },

  deregister() {
    return this.ajax('/api/v1/atlasai/deregister', 'POST');
  }
});
