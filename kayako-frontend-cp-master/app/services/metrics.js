import MetricsService from 'ember-metrics/services/metrics';
import { inject as service } from '@ember/service';

export default MetricsService.extend({
  session: service(),
  plan: service(),

  trackEvent(options = {}, ...args) {
    const standardFields = {
      actor: this.get('session.user.uuid'),
      actor_role: this.get('session.user.role.roleType'),
      instance_name: this.get('session.session.instanceName'),
      plan_name: this.get('plan.name'),
      product: this.get('plan.product.productType'),
      source: 'WEBAPP'
    };
    const newOptions = Object.assign(options, standardFields);
    this.invoke('trackEvent', newOptions, ...args);
  },
});
