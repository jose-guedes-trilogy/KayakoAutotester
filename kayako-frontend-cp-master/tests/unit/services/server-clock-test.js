import { moduleFor, test } from 'ember-qunit';
import { run } from '@ember/runloop';
import moment from 'moment';

moduleFor('service:server-clock', 'Unit | Service | server clock', {
  integration: true
});

//       +--------------------- magnitude
//       |     +--------------- unit
//       |     |           +--- expected skew
//       |     |           |
//       v     v           V
testSkew(10, 'seconds', -10000);
testSkew(-10, 'seconds', 10000);
testSkew(1, 'minute', -60000);
testSkew(-1, 'minute', 60000);
testSkew(10, 'minutes', -600000);
testSkew(-10, 'minutes', 600000);
testSkew(15, 'minutes', 0); // beyond MAX_SKEW
testSkew(-15, 'minutes', 0); // beyond MAX_SKEW

function testSkew(magnitude, unit, expected) {
  test(`if server time is ${magnitude} ${unit} adrift of local time`, function(assert) {
    let localTime = new Date(2016, 0, 1, 12, 0, 0);
    let lastKnownServerTime = moment(localTime).add(magnitude, unit).toISOString();
    let dateService = { getCurrentDate: () => localTime };
    let service = run(() => this.subject({ lastKnownServerTime, dateService }));
    let actual = service.get('skew');

    assert.equal(actual, expected, `skew is ${expected}`);
  });
}
