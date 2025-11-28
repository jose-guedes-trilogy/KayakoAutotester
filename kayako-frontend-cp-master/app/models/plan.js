import DS from 'ember-data';
import MF from 'ember-data-model-fragments';

export default DS.Model.extend({
  name: DS.attr('string'),
  features: MF.fragmentArray('feature', { async: false }),
  limits: MF.fragment('plan-limit', { async: false }),
  expiryAt: DS.attr('date'),
  product: DS.belongsTo('product'),
  billing: MF.fragment('billing'),
  accountId: DS.attr('string'),
  subscriptionId: DS.attr('string'),
  opportunityId: DS.attr('string'),
  leadId: DS.attr('string'),
  isGrandfathered: DS.attr('boolean'),
  rateplanId: DS.attr('string')
});
