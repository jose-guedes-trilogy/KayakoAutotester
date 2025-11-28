import Mirage, {faker} from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  actor: null,
  verb: 'create',
  summary: '<@https://brewfictus.kayako.com/user/1|Phoebe Todd> created <https://brewfictus.kayako.com/case/view/1|Atmosphere Coffee, Inc annual maintenance>',
  actions: () => [],
  object: null,
  object_actor: null,
  location: null,
  place: null,
  target: null,
  result: null,
  in_reply_to: null,
  participant: null,
  portal: 'API',
  weight: 0.8,
  ip_address: null,
  created_at: faker.date.recent,
  resource_type: 'activity'
});
