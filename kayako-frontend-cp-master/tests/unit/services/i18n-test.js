import { moduleFor, test } from 'ember-qunit';
import moment from 'moment';

moduleFor('service:i18n', 'Unit | Service | i18n', {
  integration: true
});

/*

What these tests say is:

Given a Date, in a certain timezone, which I wish to print as-is (in other
words, how it would appear to somone in that timezone) in my current timezone,
what Date should I send to Intl?

*/

testFormatTime({
  label: 'Africa/Johannesburg -> GMT',
  targetTime: '2016-12-01T12:00:00',
  targetZone: 'Africa/Johannesburg',
  localZone: 'Europe/London',
  expected: '2016-12-01T12:00:00Z'
});

testFormatTime({
  label: 'Africa/Johannesburg -> BST',
  targetTime: '2016-07-01T12:00:00',
  targetZone: 'Africa/Johannesburg',
  localZone: 'Europe/London',
  expected: '2016-07-01T11:00:00Z'
});

testFormatTime({
  label: 'Africa/Johannesburg -> Africa/Johannesburg',
  targetTime: '2016-07-01T12:00:00',
  targetZone: 'Africa/Johannesburg',
  localZone: 'Africa/Johannesburg',
  expected: '2016-07-01T10:00:00Z'
});

testFormatTime({
  label: 'Africa/Johannesburg -> Asia/Tokyo',
  targetTime: '2016-07-01T12:00:00',
  targetZone: 'Africa/Johannesburg',
  localZone: 'Asia/Tokyo',
  expected: '2016-07-01T03:00:00Z'
});

testFormatTime({
  label: 'Africa/Johannesburg -> America/Los_Angeles',
  targetTime: '2016-07-01T12:00:00',
  targetZone: 'Africa/Johannesburg',
  localZone: 'America/Los_Angeles',
  expected: '2016-07-01T19:00:00Z'
});

testFormatTime({
  label: 'GMT -> Africa/Johannesburg',
  targetTime: '2016-12-01T12:00:00',
  targetZone: 'Europe/London',
  localZone: 'Africa/Johannesburg',
  expected: '2016-12-01T10:00:00Z'
});

testFormatTime({
  label: 'BST -> Africa/Johannesburg',
  targetTime: '2016-07-01T12:00:00',
  targetZone: 'Europe/London',
  localZone: 'Africa/Johannesburg',
  expected: '2016-07-01T10:00:00Z'
});

function testFormatTime({
  label,
  targetTime,
  targetZone,
  localZone,
  expected
}) {
  test(`formatTime with timeZone: ${label}`, function(assert) {
    let received;
    let formatTime = (time, options) => received = { time, options };
    let intl = { formatTime };
    let hour12 = false;
    let now = () => moment.tz(targetTime, localZone);
    let i18n = this.subject({ intl, hour12, now });
    let time = moment.tz(targetTime, targetZone).toDate();
    let timeZone = targetZone;

    i18n.formatTime(time, { timeZone });

    let actual = moment.utc(received.time).format();

    assert.equal(actual, expected, `sends ${expected} to intl.formatTime`);
  });
}
