import AppsAdapter from './apps-adapter';
export default AppsAdapter.extend({
  urlForQuery({ app_installation_id }) {
    return this._urlForInstallationPrompts(app_installation_id);
  },

  updatePrompts(installation, values) {
    const url = this._urlForInstallationPrompts(installation.get('id'));
    const prompts = Object.keys(values).map(key => ({ key, value: values[key] }));
    return this.ajax(url, 'PUT', { data: { prompts } });
  },

  _urlForInstallationPrompts(app_installation_id) {
    const { host, namespace } = this.getProperties('host', 'namespace');
    return `${host}/${namespace}/app-installations/${app_installation_id}/prompts`;
  }

});
