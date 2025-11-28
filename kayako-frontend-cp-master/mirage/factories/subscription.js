import { Factory } from 'ember-cli-mirage';

export default Factory.extend({
  resource_type: 'subscription',
  name: null,
  status: 'ACTIVE', // DRAFT|PENDINGACTIVATION|PENDINGACCEPTANCE|ACTIVE|CANCELLED|EXPIRED
  version: '1',
  original_id: null,
  previous_id: null,
  account: null,
  invoice_owner: null,
  rateplans: () => [],
  duration: '3', // 1|3|5 Years
  initial_term: null,
  renewal_term: null,
  auto_renew: false,
  term_type: 'EVERGREEN', // TERMED|EVERGREEN
  instance_id: '10101222',
  start_at: () => new Date(),
  term_start_at: () => new Date(),
  term_end_at: null,
  contract_effective_at: () => new Date()
});
