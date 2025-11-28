import { moduleFor, test } from 'ember-qunit';

moduleFor('service:insights', 'Unit | Service | insights', {
  integration: true
});

test('getPreviousDates (for single day period)', function(assert) {
  let insights = this.subject();
  let startAt = '2017-02-09';
  let endAt = '2017-02-09';
  let { previousStart, previousEnd } = insights.getPreviousDates(startAt, endAt);

  assert.equal(previousStart, '2017-02-08');
  assert.equal(previousEnd, '2017-02-08');
});
