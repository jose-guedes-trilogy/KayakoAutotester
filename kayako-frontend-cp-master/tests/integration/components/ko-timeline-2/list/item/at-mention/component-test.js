import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import Service from '@ember/service';
import RSVP from 'rsvp';
import EmberObject from '@ember/object';
import { run } from '@ember/runloop';

moduleForComponent('ko-timeline-2/list/item/at-mention', 'Integration | Component | ko timeline 2/list/item/at mention', {
  integration: true,

  beforeEach() {
    this.register('service:store', Service.extend({
      findRecord() {
        return RSVP.resolve(EmberObject.create({
          fullName: 'Peter Parker'
        }));
      }
    }));
  }
});

test('renders a mention that is not the current user', function(assert) {
  assert.expect(2);

  this.register('service:session', Service.extend({
    user: {
      id: '2'
    }
  }));

  this.render(hbs`{{ko-timeline-2/list/item/at-mention subjectId="1" subjectType="user"}}`);

  assert.equal(this.$('.qa-mention').text().trim(), '@Peter Parker');
  assert.equal(0, this.$('.qa-mention.qa-mention-me').length);
});

test('renders a mention that is the current user', function(assert) {
  assert.expect(2);

  this.register('service:session', Service.extend({
    user: {
      id: '1'
    }
  }));

  this.render(hbs`{{ko-timeline-2/list/item/at-mention subjectId="1" subjectType="user"}}`);

  assert.equal(this.$('.qa-mention').text().trim(), '@Peter Parker');
  assert.equal(1, this.$('.qa-mention.qa-mention-me').length);
});

test('mention is clickable', function (assert) {
  assert.expect(1);

  this.render(hbs`{{ko-timeline-2/list/item/at-mention subjectId="1" subjectType ="user"}}`);
  assert.equal(this.$('.qa-mention-anchor').length, 1);
});

test('mention text reacts to changes in the subject data', function(assert) {
  assert.expect(2);

  this.register('service:session', Service.extend({
    user: {
      id: '1'
    }
  }));

  let user = EmberObject.create({ fullName: 'Peter Parker' });

  this.register('service:store', Service.extend({
    findRecord() {
      return RSVP.resolve(user);
    }
  }));

  this.render(hbs`{{ko-timeline-2/list/item/at-mention subjectId="1" subjectType="user"}}`);

  assert.equal(this.$('.qa-mention').text().trim(), '@Peter Parker');

  user.set('fullName', 'Bruce Wayne');

  run.next(() => assert.equal(this.$('.qa-mention').text().trim(), '@Bruce Wayne'));
});
