import Mirage, { faker } from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  title: faker.list.cycle('Normal Guys', 'Tier 2', 'Support', 'Human Resources'),
  zones: {
    monday: [1, 2, 3],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: []
  },
  holidays: [],
  is_default: false,
  created_at: '2012-01-24T22:09:30Z',
  updated_at: '2016-02-03T00:57:01Z',
  resource_type: 'business_hour',
  resource_url: 'https://support.kayakostage.net/api/v1/businesshours/5'
});
