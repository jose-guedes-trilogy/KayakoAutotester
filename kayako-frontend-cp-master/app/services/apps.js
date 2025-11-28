import Service from '@ember/service';
import { inject as service } from '@ember/service';

const DEV_MODE = window.location.search && !!window.location.search.match(/dev=true/);

export default Service.extend({
  installedApps: null,

  store: service(),

  isDevMode: DEV_MODE,

  init() {
    this._super(...arguments);
    this.set('installedApps', []);
  },

  setup(reload=false) {
    return this.get('store').findAll('app-installation', { reload }).then(installations => {
      this.set('installedApps', installations);
    });
  },

  appsForSlot(name) {
    return this.get('installedApps').filter(inst => inst.get('app.slots').mapBy('location').includes(name));
  },

  async updatePrompts(installation, promptValues) {
    await this.get('store').adapterFor('app-installation-prompt').updatePrompts(installation, promptValues);

    // now that we've updated them, update our installedApp local values with the same so they get used when navigating around
    // installation only has the public values, so make sure we only update ones already present
    const iprompts = installation.get('iprompts');
    const updated = {};
    Object.keys(iprompts).forEach(key => {
      updated[key] = promptValues[key];
    });
    installation.set('iprompts', updated);

    return true;
  },

  async install(app) {
    await this.get('store').adapterFor('app-installation').install(app);

    // install doesn't currently return the installation, so have to go find it once we're done
    await this.setup(true);
    return this.get('installedApps').findBy('app.id', app.get('id'));
  },

  async uninstall(installation) {
    await this.get('store').adapterFor('app-installation').uninstall(installation);

    // remove it from our local list of apps
    this.get('installedApps').removeObject(installation);

    return true;
  }

});
