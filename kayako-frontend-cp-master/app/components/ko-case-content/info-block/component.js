import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import { task } from 'ember-concurrency';

export default Component.extend({
  tagName: '',
  isUserOnline: false,

  // Services
  router: service('-routing'),
  notification: service(),
  i18n: service(),
  session: service(),

  // Attributes:
  user: null,
  processingOrg: false,

  // CPs
  isMe: computed('session.user.id', 'user.id', function () {
    return this.get('session.user.id') === this.get('user.id');
  }),

  isNewCase: computed('user', function () {
    return this.get('router.currentRouteName').includes('session.agent.cases.new');
  }),

  // Tasks
  updateName: task(function * (name, oldName) {
    const i18n = this.get('i18n');
    let user = this.get('user');
    user.set('fullName', name);
    try {
      yield user.save({adapterOptions: {updateName: true}});
      this.get('notification').success(i18n.t('users.name_update_success'));
    }
    catch (err) {
      this.get('notification').error(i18n.t('users.name_update_failure'));
      user.set('name', oldName);
    }
    return user;
  }).drop(),

  actions: {
    updateOrgRemovalState(value, org) {
      this.sendAction('updateOrgRemovalState', value, org);
    },

    setName(name) {
      const oldName = this.get('user.fullName');
      if (name === oldName) { return; }
      this.get('updateName').perform(name, oldName);
    },

    onPresenceChanged(data = {}) {
      let id = this.get('user.id');
      let metas = data[id] && data[id].metas;
      let isOnline = !!(metas && metas.length);

      this.set('isUserOnline', isOnline);
    }
  }

});
