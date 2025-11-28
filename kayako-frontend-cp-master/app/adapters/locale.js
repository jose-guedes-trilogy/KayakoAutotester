import ApplicationAdapter from './application';

export default ApplicationAdapter.extend({
  pathForType() {
    return 'locales';
  },

  shouldBackgroundReloadAll() {
    return false;
  },

  shouldReloadAll() {
    return true;
  }
});
