import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import { task } from 'ember-concurrency';

export default Component.extend({
  // Attributes:
  user: null,
  tagName: '',
  removedOrg: null,
  processingOrg: false,

  // State
  showAvatarChangeOptions: false,

  // Services
  i18n: service(),
  store: service(),
  session: service(),
  router: service('-routing'),
  confirmation: service(),
  notification: service(),

  // CPs
  isMe: computed('user', function () {
    return this.get('session.user.id') === this.get('user.id');
  }),

  isNewCase: computed('user', function () {
    return this.get('router.currentRouteName').includes('session.agent.cases.new');
  }),

  unsetOrgFromUser: task(function * (user, org) {
    let i18n = this.get('i18n');
    user.set('organization', null);
    let opts = {adapterOptions: {setOrganization: true}};

    try {
      yield user.save(opts);

      let message = i18n.t('organization.removal_passed', {
        name: user.get('fullName'),
        org: org.get('name')
      });
      this.get('notification').success(message);
    }
    catch (err) {
      this.get('notification').error(i18n.t('organization.removal_failed'));
      user.set('organization', org);
    }
    finally {
      this.sendAction('updateOrgRemovalState', false, null);
    }
  }),

  actions: {
    unsetOrganization() {
      let i18n = this.get('i18n');
      let user = this.get('user');
      if (!user.id) {
        user = user.content;
      }

      let org = user.get('organization');

      this.get('confirmation').confirm({
        intlConfirmationHeader: i18n.t('organization.confirm.remove_header'),
        intlConfirmationBody: i18n.t('organization.confirm.remove_body', {name: user.get('fullName'), org: org.get('name')}),
        intlConfirmLabel: i18n.t('organization.confirm.remove_confirm'),
        isIntl: true
      }).then(() => {
        this.set('removedOrg', org.get('name'));
        this.get('unsetOrgFromUser').perform(user, org);
        this.sendAction('updateOrgRemovalState', true, org.get('name'));
      });
    }
  }
});
