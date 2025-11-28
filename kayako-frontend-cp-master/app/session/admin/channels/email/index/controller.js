import Controller from '@ember/controller';
import { computed } from '@ember/object';
import { getOwner } from '@ember/application';
import { inject as service } from '@ember/service';

export default Controller.extend({
  // Services
  i18n: service(),
  notification: service(),
  confirmation: service(),

  // CPs
  enabledChannels: computed('model.@each.isDeleted', 'model.@each.isEnabled', function() {
    return this.get('model').filter((mail) => mail.get('isEnabled') && !mail.get('isDeleted'));
  }),
  disabledChannels: computed('model.@each.isDeleted', 'model.@each.isEnabled', 'model.@each.isVerified', function() {
    return this.get('model').filter((mail) => !mail.get('isEnabled') && !mail.get('isDeleted') && mail.get('isVerified'));
  }),
  unverifiedChannels: computed('model.@each.isDeleted', 'model.@each.isVerified', function() {
    return this.get('model').filter((mail) => !mail.get('isVerified') && !mail.get('isDeleted'));
  }),
  tabs: computed(function () {
    return [{
      id: 'organization',
      label: this.get('i18n').t('admin.email.tabs.mailboxes'),
      routeName: 'session.admin.channels.email',
      dynamicSegments: []
    }, {
      id: 'user',
      label: this.get('i18n').t('admin.email.tabs.settings'),
      routeName: 'session.admin.channels.email.settings',
      dynamicSegments: []
    }];
  }),

  actions: {
    editMailbox(mailbox) {
      this.transitionToRoute('session.admin.channels.email.edit', mailbox.id);
    },

    toggleEnabledProperty(channel, e) {
      e.stopPropagation();
      channel.toggleProperty('isEnabled');
      channel.save().then(() => {
        const notificationMessage = this.get('i18n').t(
          channel.get('isEnabled') ? 'admin.email.enabled.message' : 'admin.email.disabled.message'
        );
        this.get('notification').success(notificationMessage);
      });
    },

    makeDefault(mailbox, e) {
      e.stopPropagation();
      const adapter = getOwner(this).lookup('adapter:application');
      const url = `${adapter.namespace}/mailboxes/default`;

      //TODO: this model is left dirty - it is not an issue,
      //but ideally we would mark this as clean.
      this.get('model').forEach(mailbox => {
        mailbox.set('isDefault', false);
      });
      mailbox.set('isDefault', true);

      const options = {
        data: { mailbox_id: mailbox.get('id') }
      };

      adapter.ajax(url, 'PUT', options).then(() => {
        const notificationMessage = this.get('i18n').t('admin.email.default.message');
        this.get('notification').success(notificationMessage);
      });
    },

    delete(mailbox, e) {
      e.preventDefault();
      e.stopPropagation();
      return this.get('confirmation').confirm({
        intlConfirmationBody: 'generic.confirm.delete'
      })
      .then(() => mailbox.destroyRecord())
      .then(() => {
        let msg = this.get('i18n').t('admin.email.deleted.message');
        this.get('notification').success(msg);
      });
    }
  }
});
