import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import RSVP from 'rsvp';
import { getOwner } from '@ember/application';

import { click } from 'ember-native-dom-helpers';
import Service from '@ember/service';

moduleForComponent('ko-timeline-2/list/item/created-at', 'Integration | Component | ko timeline 2/list/item/created at', {
  integration: true,
  setup() {
    const intl = getOwner(this).lookup('service:intl');
    intl.setLocale('en-us');
    intl.addTranslations('en-us', {
      cases: {
        email_original_display: {
          errors: {
            '404': {
              header: 'Header',
              description1: 'Description1',
              description2: 'Description2'
            },
            '500': {
              header: 'Header',
              description1: 'Description1',
              description2: 'Description2'
            }
          }
        }
      }
    });
  }
});

test('it renders a created at date that opens a browser popup when post is a tweet', function(assert) {
  assert.expect(4);

  this.register('service:window', Service.extend({
    open(url, windowName, windowFeatures) {
      assert.equal(url, 'https://twitter.com/davegrohl/status/1234', 'Open url in popup');
      assert.equal(windowName, '', 'Open popup without window name');
      assert.deepEqual(windowFeatures, {
        height: '500',
        width: '800'
      }, 'Open popup with correct window features');
    }
  }));

  this.set('model', {
    sourceChannel: {
      channelType: 'TWITTER'
    },
    original: {
      screenName: 'davegrohl',
      id: '1234'
    }
  });

  this.render(hbs`
    {{#ko-timeline-2/list/item/created-at model=model}}
      CHEESE
    {{/ko-timeline-2/list/item/created-at}}
  `);

  assert.equal(this.$('.qa-created-at-twitter-link').text().trim(), 'CHEESE', 'Created at twitter link displayed');

  click('.qa-created-at-twitter-link');
});

test('it renders a simple created at date string for an email from an agent', function(assert) {
  assert.expect(1);

  this.set('model', {
    id: 1234,
    creator: {
      role: {
        isAgentOrHigher: true
      }
    },
    sourceChannel: {
      channelType: 'MAIL'
    }
  });

  this.render(hbs`
    {{#ko-timeline-2/list/item/created-at model=model}}
      CHEESE
    {{/ko-timeline-2/list/item/created-at}}
  `);

  assert.equal(this.$('.qa-created-at-string').text().trim(), 'CHEESE', 'Created at static text displayed');
});

test('it renders a simple created at date string for a non email', function(assert) {
  assert.expect(1);

  this.set('model', {
    sourceChannel: {
      channelType: 'NOTE'
    }
  });

  this.render(hbs`
    {{#ko-timeline-2/list/item/created-at model=model}}
      CHEESE
    {{/ko-timeline-2/list/item/created-at}}
  `);

  assert.equal(this.$('.qa-created-at-string').text().trim(), 'CHEESE', 'Created at static text displayed');
});

test('it renders a NOT FOUND modal when the original email cannot be found', function(assert) {
  assert.expect(4);

  this.register('service:store', Service.extend({
    findRecord(type, id) {
      return RSVP.reject({
        errors: [{
          code: 'RESOURCE_NOT_FOUND'
        }]
      });
    }
  }));

  this.set('model', {
    id: 1234,
    sourceChannel: {
      channelType: 'MAIL'
    }
  });

  this.render(hbs`
    <div id="modals"></div>

    {{#ko-timeline-2/list/item/created-at model=model}}
      CHEESE
    {{/ko-timeline-2/list/item/created-at}}
  `);

  click('.qa-created-at-email-link');

  assert.equal(this.$('.404-error-image').length, 1, '404 image displayed');
  assert.equal(this.$('.404-error-header').text().trim(), 'Header', '404 header displayed');
  assert.equal(this.$('.404-error-description-1').text().trim(), 'Description1', '404 description line 1 displayed');
  assert.equal(this.$('.404-error-description-2').text().trim(), 'Description2', '404 description line 2 displayed');
});

test('it renders a SERVER ERROR modal when the an error is returned from the server', function(assert) {
  assert.expect(4);

  this.register('service:store', Service.extend({
    findRecord(type, id) {
      return RSVP.reject({
        errors: [{
          code: 'ACTION_FAILED'
        }]
      });
    }
  }));

  this.set('model', {
    id: 1234,
    sourceChannel: {
      channelType: 'MAIL'
    }
  });

  this.render(hbs`
    <div id="modals"></div>

    {{#ko-timeline-2/list/item/created-at model=model}}
      CHEESE
    {{/ko-timeline-2/list/item/created-at}}
  `);

  click('.qa-created-at-email-link');

  assert.equal(this.$('.500-error-image').length, 1, '500 image displayed');
  assert.equal(this.$('.500-error-header').text().trim(), 'Header', '500 header displayed');
  assert.equal(this.$('.500-error-description-1').text().trim(), 'Description1', '500 description line 1 displayed');
  assert.equal(this.$('.500-error-description-2').text().trim(), 'Description2', '500 description line 2 displayed');
});
