import Mirage, { faker } from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  name: faker.list.cycle(
    'caseid', 'subject', 'casestatusid',
    'assigneeteamid', 'requesterid', 'rating',
    'sla', 'priority', 'last_replier', 'updatedat', 'lastcreatedat'
  ),
  resource_type: 'column'
});
