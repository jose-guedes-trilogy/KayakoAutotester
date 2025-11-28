import { Factory } from 'ember-cli-mirage';

export default Factory.extend({
  resource_type: 'timetracking_activity',
  log_type: 'VIEWED',
  case: null,
  agent: null,
  total_time_spent: 0,
  created_at() { return new Date(); },
  updated_at() { return this.created_at; }
});
