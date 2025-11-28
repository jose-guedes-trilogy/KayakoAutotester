import AppsAdapter from './apps-adapter';
export default AppsAdapter.extend({

  install(app) {
    const name = app.get('name');
    const { host, namespace } = this.getProperties('host', 'namespace');
    const url = `${host}/${namespace}/app-installations`;
    return this.ajax(url, 'POST', { data: { name } });
  },

  uninstall(installation) {
    const name = installation.get('app.name');
    const { host, namespace } = this.getProperties('host', 'namespace');
    const url = `${host}/${namespace}/app-installations`;
    return this.ajax(url, 'DELETE', { data: { name } });
  }

});
