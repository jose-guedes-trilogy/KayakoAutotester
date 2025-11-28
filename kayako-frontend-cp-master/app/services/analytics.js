import Service, { inject as service } from '@ember/service';
import { variation } from 'ember-launch-darkly';

export default Service.extend({
  metrics: service(),
  session: service(),
  plan: service(),

  setup() {
    let user;
    if (variation('release-remember-me')) {
      user = this.get('session.user');
    } else {
      user = this.get('session.session.user');
    }

    const instanceId = this.get('session.session.instanceId');
    const planName = this.get('plan.plan.name');
    const instanceName = this.get('session.session.instanceName');

    this.set('metrics.context.groupId', instanceId);

    this.get('metrics').identify({
      distinctId: user.get('uuid'),
      name: user.get('fullName'),
      email: user.get('primaryEmail.email'),
      role_type: user.get('role.roleType'),
      created_at: user.get('createdAt'),
      instance_name: instanceName,
      locale: user.get('locale.locale')
    });

    this.get('metrics').invoke('group', {
      groupId: instanceId,
      name: instanceName,
      plan: planName
    });
  }
});
