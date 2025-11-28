import { relativeTermForDate } from 'frontend-cp/helpers/relative-term-for-date';
import { module, test } from 'qunit';
import moment from 'moment';

module('Unit | Helper | relative-term-for-date');

const timezone = 'America/Tijuana';
const utc = str => moment.utc(str).toDate();

test('today', function(assert) {
  let now = utc('2017-01-01T12:00:00Z');
  let date = utc('2017-01-01T12:00:00Z');
  let actual = relativeTermForDate([date], { now, timezone });
  let expected = 'today';

  assert.equal(actual, expected);
});

test('yesteday', function(assert) {
  let now = utc('2017-01-01T12:00:00Z');
  let date = utc('2017-01-01T07:00:00Z');
  let actual = relativeTermForDate([date], { now, timezone });
  let expected = 'yesterday';

  assert.equal(actual, expected);
});

test('otherwise', function(assert) {
  let now = utc('2017-01-01T12:00:00Z');
  let date = utc('2017-01-05T12:00:00Z');
  let actual = relativeTermForDate([date], { now, timezone });
  let expected = null;

  assert.equal(actual, expected);
});
