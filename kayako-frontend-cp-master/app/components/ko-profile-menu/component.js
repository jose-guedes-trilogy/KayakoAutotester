import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';

export default Component.extend({
  session: service(),
  routing: service('-routing'),
  permissions: service(),
  i18n: service(),

  // HTML
  tagName: '',

  // CPs
  user: computed.readOnly('session.user'),
  isAdmin: computed('session.permissions', function () {
    return this.get('permissions').has('app.admin.access');
  }),

  options: computed('isAdmin', 'user.isMfaEnabled', 'user.signature', function () {
    const i18n = this.get('i18n');
    let options = [
      { label: i18n.t('generic.view_your_profile'), id: 'profile', appendSeparator: true }
    ];

    options.push({ label: i18n.t('users.editsignature'), id: 'editSignature' });
    if (this.get('user.isMfaEnabled')) {
      options.push({ label: i18n.t('users.two_factor.menu.disable'), id: 'disable2fa' });
    } else {
      options.push({ label: i18n.t('users.two_factor.menu.enable'), id: 'enable2fa' });
    }

    options.push({ label: i18n.t('users.change_password.title'), id: 'changePassword' });

    if (this.get('isAdmin')) {
      options.push({ label: i18n.t('admin.administration'), id: 'admin', appendSeparator: true });
    }

    options.push({ label: i18n.t('generic.view_keyboard_shortcuts'), id: 'shortcuts'});

    options.push({ label: i18n.t('generic.need_help'), id: 'help' });

    options.push({ label: i18n.t('generic.logout'), id: 'logout' });
    return options;
  }),

  // Actions
  actions: {
    selectItem(option, dropdown) {
      switch (option.id) {
        case 'profile':
          this.get('routing').transitionTo('session.agent.users.user', [this.get('session.user')]);
          break;
        case 'disable2fa':
          this.get('onDisableTwoFactorAuth')();
          break;
        case 'enable2fa':
          this.get('onEnableTwoFactorAuth')();
          break;
        case 'manageAppAccess':
          this.get('onManageAppAccess')();
          break;
        case 'editSignature':
          this.get('onEditSignature')();
          break;
        case 'changePassword':
          this.get('onChangePassword')();
          break;
        case 'shortcuts':
          this.get('onShowKeyboardHelp')();
          break;
        case 'admin':
          this.get('routing').transitionTo('session.admin');
          break;
        case 'help':
          dropdown.actions.close();
          window.open('https://support.kayako.com');
          break;
        case 'logout':
          this.get('session').logout();
          break;
      }
    }
  }
});
