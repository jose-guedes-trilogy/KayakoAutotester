import ApplicationAdapter from './application';

export default ApplicationAdapter.extend({
  pathForType() {
    return 'organizations/fields';
  },

  shouldBackgroundReloadRecord() {
    return true;
  }
});
