import Mirage, { faker } from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  id: i => i + 1,
  due_at: new Date(),
  amount: faker.finance.amount(),
  resource_url: faker.internet.url(),
  resource_type: 'invoice'
});
