import Mirage, {faker} from 'ember-cli-mirage';
import moment from 'moment';

const EPOCH = '2017-01-01T07:00:00Z';
const STEP = 6;
const makeDate = i => moment.utc(EPOCH).add(i * STEP, 'hours').toDate();

export default Mirage.Factory.extend({
  client_id: () => faker.random.uuid(),
  uuid: () => faker.random.uuid(),
  sequence: i => i + 1,
  subject: '',
  contents: '',
  creator: null,
  identity: null,
  source_channel: null,
  attachments: () => [],
  download_all: null,
  original: null,
  post_status: '',
  created_at: makeDate,
  updated_at: makeDate,

  // is_requester is not documented but seems to be returned as a boolean
  resource_type: 'post',

  // Fields only used for mirage's ability to link post to case/user/organization
  case_id: null,
  user_id: null,
  organization_id: null
});
