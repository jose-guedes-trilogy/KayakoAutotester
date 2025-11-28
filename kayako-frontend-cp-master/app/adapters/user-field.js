import ApplicationAdapter from './application';

export default ApplicationAdapter.extend({
  pathForType() {
    return 'users/fields';
  },

  shouldBackgroundReloadRecord() {
    return true;
  }
});
