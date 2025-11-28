import { Factory } from 'ember-cli-mirage';

export default Factory.extend({
  resource_type: 'timetracking_tracked',
  billed: 0,
  worked: 0,
  entries: () => [],
  created_at() { return new Date(); },
  updated_at() { return this.created_at; }
});
