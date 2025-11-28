import { Factory } from 'ember-cli-mirage';

export default Factory.extend({
  resource_type: 'contact',
  first_name: 'Test',
  last_name: 'Contact',
  address1: '',
  address2: '',
  city: '',
  state: '',
  county: '',
  country: 'GB',
  postal_code: '',
  tax_region: '',
  work_phone: '',
  mobile_phone: '',
  home_phone: '',
  personal_email: '',
  work_email: ''
});
