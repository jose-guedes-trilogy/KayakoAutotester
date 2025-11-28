import Mirage, {faker} from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  label: i => `webhook-${i + 1}`,
  description: faker.lorem.sentence,
  channel: '',
  token: '',
  isEnabled: true,
  resource_type: 'token',
  lastUsedAt: faker.date.recent,
  createdAt: faker.date.recent,
  updatedAt: faker.date.recent
});
