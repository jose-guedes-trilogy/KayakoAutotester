import ApplicationAdapter from './application';

export default ApplicationAdapter.extend({
  pathForType() {
    return 'facebook/account/callback';
  }
});
