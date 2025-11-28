import Service from '@ember/service';
import Ember from 'ember';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';

const NullAppcues = {
  identify() {},
  start() {},
  track() {}
};

export default Service.extend({
  session: service(),
  plan: service(),

  appcues: computed(function() {
    const Appcues = window.Appcues;

    if (Ember.testing || !Appcues) {
      return NullAppcues;
    } else {
      return Appcues;
    }
  }),

  identify() {
    let user = this.get('session.user');

    if (!user) {
      return;
    }

    let props = {
      name: user.get('fullName'),
      email: user.get('primaryEmailAddress'),
      role: user.get('role.roleType'),

      created_at: dateToUnixTimestamp(user.get('createdAt')),
      last_seen: dateToUnixTimestamp(user.get('lastSeenAt')),
      last_active: dateToUnixTimestamp(user.get('lastActiveAt')),
      last_activity: dateToUnixTimestamp(user.get('lastActivityAt')),
      last_logged_in_at: dateToUnixTimestamp(user.get('lastLoggedInAt')),

      instance_name: this.get('session.session.instanceName'),
      instance_id: this.get('session.session.instanceId'),
      is_trial: this.get('plan.isTrial'),
      expiry: dateToUnixTimestamp(this.get('plan.expiryAt')),

      account_id: this.get('plan.accountId'),
      lead_id: this.get('plan.leadId'),
      plan_name: this.get('plan.name'),
      opportunity_id: this.get('plan.opportunityId'),
      subscription_id: this.get('plan.subscriptionId'),
      rateplan_id: this.get('plan.rateplanId'),
      product_id: this.get('plan.product.id'),
      is_grandfathered: this.get('plan.isGrandfathered')
    };

    this.get('appcues').identify(user.get('uuid'), props);
  },

  start() {
    this.get('appcues').start();
  },

  track() {
    this.get('appcues').track(...arguments);
  }
});

function dateToUnixTimestamp(date) {
  if (!date) { return null; }
  return Math.round(date.getTime() / 1000);
}
