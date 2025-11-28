import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';

export default Component.extend({
  tagName: '',

  size: 'normal',
  user: null,
  showTooltip: true,

  _userOnline: false,

  i18n: service(),
  session: service(),

  tooltipLabel: computed('session.user', 'user', 'showTooltip', function() {
    let user = this.get('user');
    let loggedInUser = this.get('session.user');
    let i18n = this.get('i18n');

    if (user.get('id') === loggedInUser.get('id')) {
      return i18n.t('generic.you_are_online');
    }

    return i18n.t('generic.user_is_online', { name: user.get('fullName') });
  }),

  actions: {
    onPresenceChanged(data = {}) {
      let id = this.get('user.id');
      let metas = data[id] && data[id].metas;
      let isOnline = !!(metas && metas.length);

      this.set('_userOnline', isOnline);
    }
  }
});
