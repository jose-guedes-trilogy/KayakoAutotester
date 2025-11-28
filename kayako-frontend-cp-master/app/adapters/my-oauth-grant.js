import ApplicationAdapter from './application';

export default ApplicationAdapter.extend({
  pathForType() {
    return 'oauth/my_grants';
  }
});
