import ApplicationAdapter from './application';

export default ApplicationAdapter.extend({
  pathForType() {
    return 'messenger/settings';
  },

  // Makes a put request to save messenger settings. The API creates a messenger_setting resource if it doesn't exist
  saveMessengerSettings(brandId, settings) {
    const url = `${this.namespace}/messenger/settings?include=locale_field`;
    const payload = Object.assign({}, settings, { brand_id: brandId });
    return this.ajax(url, 'PUT', { data: payload});
  }
});
