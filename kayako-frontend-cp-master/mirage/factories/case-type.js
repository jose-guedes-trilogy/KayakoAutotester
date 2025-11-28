import Mirage, { faker } from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  label: faker.list.cycle('Question', 'Task', 'Problem', 'Incident'),
  created_at: '2015-07-09T15:36:10Z',
  updated_at: '2015-07-09T15:36:10Z',
  resource_type: 'case_type',
  resource_url: 'http://novo/api/index.php?/v1/cases/types/1'
});
