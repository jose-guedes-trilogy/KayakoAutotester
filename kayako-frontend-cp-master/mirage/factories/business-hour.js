import Mirage from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  title: 'Default Business Hours',
  zones: {
    monday: [
      9,
      10,
      11,
      12,
      13,
      14,
      15,
      16,
      17,
      18
    ],
    tuesday: [
      9,
      10,
      11,
      12,
      13,
      14,
      15,
      16,
      17,
      18
    ],
    wednesday: [
      9,
      10,
      11,
      12,
      13,
      14,
      15,
      16,
      17,
      18
    ],
    thursday: [
      9,
      10,
      11,
      12,
      13,
      14,
      15,
      16,
      17,
      18
    ],
    friday: [
      9,
      10,
      11,
      12,
      13,
      14,
      15,
      16,
      17,
      18
    ],
    saturday: [],
    sunday: []
  },
  holidays: () => [],
  created_at: '2015-07-23T13:36:12Z',
  updated_at: '2015-07-23T13:36:12Z',
  resource_type: 'business_hour',
  resource_url: 'http://novo/api/index.php?/v1/businesshours/1'
});
