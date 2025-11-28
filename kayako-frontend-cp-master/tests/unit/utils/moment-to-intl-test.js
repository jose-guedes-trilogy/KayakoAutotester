import momentToIntl from 'frontend-cp/utils/moment-to-intl';
import { module, test } from 'qunit';
import moment from 'moment';

module('Unit | Utility | moment-to-intl');

test('it works', function(assert) {
  let momentDate = moment.utc('2017-01-01T07:00:00Z').tz('America/Tijuana');
  let actual = momentToIntl(momentDate);

  assert.equal(
    moment(actual).format('YYYY-MM-DD HH:mm:ss'),
    '2016-12-31 23:00:00',
    'it creates a Date that will display the intended string no matter the browser timezone'
  );
});
