import Mirage from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  goal_in_seconds: 120,
  operational_hours: 'BUSINESS_HOURS',
  type: 'FIRST_REPLY_TIME',
  priority: null,
  resource_type: 'sla_version_target'
});
