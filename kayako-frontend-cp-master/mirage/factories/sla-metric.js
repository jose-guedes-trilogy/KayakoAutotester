import Mirage, { faker } from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  metric_type: faker.list.cycle('FIRST_REPLY_TIME', 'RESOLUTION_TIME', 'NEXT_REPLY_TIME'),
  stage: faker.list.cycle('ACTIVE', 'COMPLETED'),
  due_at: faker.date.recent,
  completed_at: faker.date.recent,
  target: null,
  resource_type: 'sla_metric'
});
