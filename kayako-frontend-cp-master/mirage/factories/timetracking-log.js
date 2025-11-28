import { Factory } from 'ember-cli-mirage';

export default Factory.extend({
  resource_type: 'timetracking_log',
  log_type: 'WORKED',
  case: null,
  agent: null,
  creator: null,
  time_spent: 0,
  current_time: 0
});
