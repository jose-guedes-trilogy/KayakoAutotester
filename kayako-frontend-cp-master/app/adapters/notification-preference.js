import ApplicationAdapter from './application';

export default ApplicationAdapter.extend({
  pathForType() {
    return 'notification_preferences';
  },

  updatePreferences(data) {
    let url = `${this.namespace}/notification_preferences`;
    return this.ajax(url, 'PUT', { data: { values: data } });
  },
});
