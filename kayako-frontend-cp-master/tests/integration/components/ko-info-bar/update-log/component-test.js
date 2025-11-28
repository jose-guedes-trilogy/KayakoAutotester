import Service from '@ember/service';
import { computed } from '@ember/object';
import EmberObject from '@ember/object';
import { getOwner } from '@ember/application';
import moment from 'moment';
import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

let testDateTime = moment('2016-07-01 09:33:55');

//Make sure no skew is applied, it's not what this test is interested in testing
let serverClockStub = Service.extend({
  getServerTime() {
    return moment(testDateTime);
  }
});

//Make sure the current date and time is fixed and not fetched from the system
//This should stop any time related brittleness in the test
let dateStub = Service.extend({
  getCurrentDate(dateTime) {
    return testDateTime;
  }
});

moduleForComponent('ko-info-bar/update-log', 'Integration | Component | ko-info-bar/update-log', {
  integration: true,

  beforeEach: function() {
    let intlService = getOwner(this).lookup('service:intl');
    intlService.setLocale('en-us');
    intlService.addTranslations('en-us', {
      cases: {
        log: {
          title: 'This case has been updated'
        }
      },
      generic: {
        times: 'times'
      }
    });

    this.register('service:server-clock', serverClockStub);
    this.register('service:date', dateStub);
  }
});

test('should display a single log entry', function(assert) {
  assert.expect(4);

  let userName = 'Mickey Bubbles';
  let user = EmberObject.extend({
    fullName: computed('name', function() {
      return this.get('name');
    })
  }).create({
    id: 1,
    name: userName
  });

  this.set('testUpdateLog', [
    {
      updatedAt: testDateTime.subtract(1, 'second'),
      user: user
    }
  ]);

  this.set('emptyCloseFunction', () => {});

  this.render(hbs`{{ko-info-bar/update-log updateLog=testUpdateLog onClose=emptyCloseFunction}}`);

  assert.equal(this.$('ul').length, 1, 'one entry in the log');
  assert.equal(this.$('.qa-username').text().trim(), userName, 'username is correct');
  assert.notOk(this.$('.qa-number-of-times').text(), 'number of times should not be shown for a single entry');
  assert.equal(this.$('.qa-time-from-now').text().trim(), 'a few seconds ago', 'time from now is correct');
});


test('should display log entries grouped by user', function(assert) {
  assert.expect(7);

  let user1 = 'Mickey Bubbles';
  let user2 = 'Damon Allbran';
  let aSecondAgo = moment(testDateTime).subtract(1, 'second').toString();
  let aMinuteAgo = moment(testDateTime).subtract(1, 'minute').toString();
  let aHourAgo = moment(testDateTime).subtract(1, 'hour').toString();

  this.set('testUpdateLog', [
    {
      updatedAt: aSecondAgo,
      user: {
        id: 1,
        fullName: user1
      }
    },
    {
      updatedAt: aSecondAgo,
      user: {
        id: 2,
        fullName: user2
      }
    },
    {
      updatedAt: aMinuteAgo,
      user: {
        id: 1,
        fullName: user1
      }
    },
    {
      updatedAt: aMinuteAgo,
      user: {
        id: 2,
        fullName: user2
      }
    },
    {
      updatedAt: aHourAgo,
      user: {
        id: 1,
        fullName: user1
      }
    },
    {
      updatedAt: aHourAgo,
      user: {
        id: 2,
        fullName: user2
      }
    }
  ]);

  this.set('emptyCloseFunction', () => {});

  this.render(hbs`{{ko-info-bar/update-log updateLog=testUpdateLog onClose=emptyCloseFunction}}`);

  assert.equal(this.$('ul').length, 1, 'two entries in the log');
  assert.equal(this.$('li:nth-of-type(1) .qa-username').text().trim(), user1, 'username is correct');
  assert.equal(this.$('li:nth-of-type(1) .qa-number-of-times').text().trim(), '3 times,', 'number of times is correct');
  assert.equal(this.$('li:nth-of-type(1) .qa-time-from-now').text().trim(), 'a few seconds ago', 'time from now is correct');
  assert.equal(this.$('li:nth-of-type(2) .qa-username').text().trim(), user2, 'username is correct');
  assert.equal(this.$('li:nth-of-type(2) .qa-number-of-times').text().trim(), '3 times,', 'number of times is correct');
  assert.equal(this.$('li:nth-of-type(2) .qa-time-from-now').text().trim(), 'a few seconds ago', 'time from now is correct');
});
