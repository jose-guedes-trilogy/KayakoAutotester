import Mirage, { faker } from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  collaborators: faker.random.number,
  agents: faker.random.number
});
