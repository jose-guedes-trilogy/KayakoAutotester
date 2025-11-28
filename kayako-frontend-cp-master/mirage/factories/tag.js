import Mirage, { faker } from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  name: faker.list.cycle('solution', 'status', 'bug', 'outage', 'DDOS', 'Beta', 'Frontend', 'Backend', 'Devops', 'Friday-lunch'),
  resource_type: 'tag'
});
