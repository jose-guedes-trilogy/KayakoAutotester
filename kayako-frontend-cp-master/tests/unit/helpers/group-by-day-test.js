import { groupByDay } from 'frontend-cp/helpers/group-by-day';
import { module, test } from 'qunit';
import moment from 'moment';

module('Unit | Helper | group-by-day');

const utc = str => moment.utc(str).toDate();

test('it works', function(assert) {
  let posts = [{
    id: 1,
    createdAt: utc('2017-01-01T07:00:00Z') // The day before in Tijuana
  }, {
    id: 2,
    createdAt: utc('2017-01-01T08:00:00Z')
  }, {
    id: 3,
    createdAt: utc('2017-01-01T09:00:00Z')
  }, {
    id: 4,
    createdAt: utc('2017-01-02T08:00:00Z')
  }];

  let expected = [{
    day: '2016-12-31',
    items: [posts[0]]
  }, {
    day: '2017-01-01',
    items: [posts[1], posts[2]]
  }, {
    day: '2017-01-02',
    items: [posts[3]]
  }];

  let actual = groupByDay([posts], { key: 'createdAt', timezone: 'America/Tijuana' });

  assert.deepEqual(actual, expected);
});

