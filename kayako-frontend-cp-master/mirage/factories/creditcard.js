import Mirage, { faker } from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  id: i => i + 1,
  card_type: 'VISA',
  number: '**** **** **** 4111',
  address1: faker.address.streetAddress(),
  address2: null,
  city: faker.address.city(),
  state: faker.address.state(),
  postal_code: faker.address.zipCode(),
  expiry_month: 10,
  expiry_year: 2018,
  country: faker.address.country(),
  is_default: false,
  name: faker.name.firstName,
  resource_type: 'credicard'
});
