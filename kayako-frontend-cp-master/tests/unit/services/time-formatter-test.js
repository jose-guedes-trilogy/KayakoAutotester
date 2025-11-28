import { moduleFor, test } from 'ember-qunit';
import moment from 'moment';
import { getOwner } from '@ember/application';
import translations from 'frontend-cp/locales/en-us';

moduleFor('service:time-formatter', 'Unit | Service | time formatter', {
  integration: true,

  setup() {
    const intl = getOwner(this).lookup('service:intl');
    intl.setLocale('en-us');
    intl.addTranslations('en-us', translations);
  }
});

test('it works for the lesser half of a minute in the 1-2 minute range', function(assert) {
  const service = this.subject();

  let now = moment();
  let time = moment().subtract(1.25, 'minutes');

  assert.equal(service.shortFormatRelative(now, time), '1m', 'short format relative time for 1.25 minutes is `1m`');
  assert.equal(service.getLocalizedOutput(now, time), 'a minute ago', 'localized relative time for 1.25 minutes is `a minute ago`');
});

test('it works for the greater half of a minute in the 1-2 minute range', function(assert) {
  const service = this.subject();

  let now = moment();
  let time = moment().subtract(1.75, 'minutes');

  assert.equal(service.shortFormatRelative(now, time), '2m', 'short format relative time for 1.75 minutes is `2m`');
  assert.equal(service.getLocalizedOutput(now, time), '2 minutes ago', 'localized relative time for 1.75 minutes is `2 minutes ago`');
});
