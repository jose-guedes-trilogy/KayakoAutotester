import Component from '@ember/component';

export default Component.extend({
  // Attributes:
  user: null,
  processingOrg: false,
  isUserOnline: false,

  tagName: '',

  actions: {
    updateOrgRemovalState(value, org) {
      this.sendAction('updateOrgRemovalState', value, org);
    },

    onPresenceChanged(data = {}) {
      let id = this.get('user.id');
      let metas = data[id] && data[id].metas;
      let isOnline = !!(metas && metas.length);

      this.set('isUserOnline', isOnline);
    }
  }
});
