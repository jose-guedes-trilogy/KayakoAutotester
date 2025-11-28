import Mirage, { faker } from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  label: faker.list.cycle('New', 'Open', 'Pending', 'Completed', 'Closed'),
  color: null,
  visibility: 'PUBLIC',
  type: faker.list.cycle('NEW', 'OPEN', 'PENDING', 'COMPLETED', 'CLOSED'),
  locales: [],
  is_sla_active: true,
  is_deleted: false,
  created_at: '2015-07-09T15:36:10Z',
  updated_at: '2015-07-09T15:36:10Z',
  resource_type: 'case_status',
  resource_url: (i) => `http://novo/api/index.php?/v1/cases/statuses/${i}`
});
