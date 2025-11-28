import ApplicationAdapter from './application';

export default ApplicationAdapter.extend({
  pathForType() {
    return 'twitter/account/callback';
  }
});
