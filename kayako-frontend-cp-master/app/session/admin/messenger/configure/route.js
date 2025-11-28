import Route from '@ember/routing/route';
import { variation } from 'ember-launch-darkly';
import RSVP from 'rsvp';
import { inject as service } from '@ember/service';

export default Route.extend({
  confirmation: service(),
  model() {
    const store = this.get('store');
    const brand = store.findAll('brand');

    let messengerSetting = undefined;
    let businessHour = undefined;

    if(variation('release-messenger-persistent-settings')) {
      messengerSetting = store.findAll('messenger-setting');
      businessHour = store.findAll('business-hour');
    }

    const twitterAccounts = store.findAll('twitter-account');
    const metrics = store.queryRecord('conversation-starter', {});

    return RSVP.hash({
      brand,
      twitterAccounts,
      metrics,
      messengerSetting,
      businessHour
    });
  },

  discardChanges: false,
  // Actions
  actions: {
    willTransition(transition) {
      if (!variation('release-messenger-persistent-settings')) {
        return;
      }
      let isEdited = this.controller.get('isEdited');

      if (typeof isEdited === 'function') {
        isEdited = Reflect.apply(isEdited, this.controller, []);
      }

      if (!this.discardChanges && isEdited) {
        transition.abort();
        this.get('confirmation').confirm({
          intlConfirmationHeader: 'generic.confirm.lose_changes_header',
          intlConfirmationBody: 'generic.confirm.lose_changes',
          intlConfirmLabel: 'generic.confirm.lose_changes_button'
        }).then(() => {
          this.discardChanges = true;
          transition.retry();
        });
      }
      return true;
    },
    didTransition() {
      this.discardChanges = false;
    }
  }
});
