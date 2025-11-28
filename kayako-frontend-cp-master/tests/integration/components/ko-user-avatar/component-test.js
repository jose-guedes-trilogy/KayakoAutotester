/*eslint-disable prefer-reflect */

import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import EmberObject from '@ember/object';
import MockSocket from '../../../helpers/mocks/socket';

moduleForComponent('ko-user-avatar', 'Integration | Component | ko user avatar', {
  integration: true,

  beforeEach() {
    this.register('constructor:socket', MockSocket, { instantiate: false });

    this.inject.service('socket', { as: 'socket' });
  }
});

test('[inline] show loading state when image is loading', function(assert) {
  assert.expect(2);

  this.set('user', EmberObject.create({
    avatar: 'foo.png'
  }));

  this.render(hbs`{{ko-user-avatar user=user}}`);

  assert.equal(this.$('.qa-avatar-loaded-false').length, 1, 'Image has not yet loaded');
  assert.equal(this.$('.qa-avatar-loading').length, 1, 'Loading placeholder visible');
});

test('[inline] render avatar for user with default settings', function(assert) {
  assert.expect(5);

  this.set('user', EmberObject.create({
    avatar: 'foo.png'
  }));

  this.render(hbs`{{ko-user-avatar user=user}}`);

  this.$('img').trigger('onload');

  assert.equal(this.$('.qa-avatar-loaded-true').length, 1, 'Image has loaded');
  assert.equal(this.$('.qa-avatar-image').attr('src'), 'foo.png', 'Image src pulled from user object');
  assert.equal(this.$('.qa-avatar-loading').length, 0, 'Loading placeholer is hidden');
  assert.equal(this.$('.qa-avatar-type-square').length, 1, 'Square avatar displayed');
  assert.equal(this.$('.qa-avatar-size-normal').length, 1, 'Normal sized avatar displayed');
});

test('[inline] render avatar with custom settings', function(assert) {
  assert.expect(6);

  this.set('user', EmberObject.create({
    avatar: ''
  }));

  render.call(this, hbs`{{ko-user-avatar user=user type="round"}}`);
  assert.equal(this.$('.qa-avatar-type-round').length, 1, 'Round avatar displayed');

  render.call(this, hbs`{{ko-user-avatar user=user size="micro"}}`);
  assert.equal(this.$('.qa-avatar-size-micro').length, 1, 'Micro sized avatar displayed');

  render.call(this, hbs`{{ko-user-avatar user=user size="small"}}`);
  assert.equal(this.$('.qa-avatar-size-small').length, 1, 'Small sized avatar displayed');

  render.call(this, hbs`{{ko-user-avatar user=user size="submedium"}}`);
  assert.equal(this.$('.qa-avatar-size-submedium').length, 1, 'Submedium sized avatar displayed');

  render.call(this, hbs`{{ko-user-avatar user=user size="medium"}}`);
  assert.equal(this.$('.qa-avatar-size-medium').length, 1, 'Medium sized avatar displayed');

  render.call(this, hbs`{{ko-user-avatar user=user size="large"}}`);
  assert.equal(this.$('.qa-avatar-size-large').length, 1, 'Large sized avatar displayed');
});

test('[block] render the user avatar', function(assert) {
  assert.expect(5);

  this.set('user', EmberObject.create({
    avatar: 'foo.png'
  }));

  this.render(hbs`
    {{#ko-user-avatar user=user as |avatar|}}
      {{avatar.image}}
    {{/ko-user-avatar}}
  `);

  assert.equal(this.$('.qa-avatar-loaded-false').length, 1, 'Image has not yet loaded');
  assert.equal(this.$('.qa-avatar-loading').length, 1, 'Loading placeholder visible');

  this.$('img').trigger('onload');

  assert.equal(this.$('.qa-avatar-loaded-true').length, 1, 'Image has loaded');
  assert.equal(this.$('.qa-avatar-image').attr('src'), 'foo.png', 'Image src pulled from user object');
  assert.equal(this.$('.qa-avatar-loading').length, 0, 'Loading placeholer is hidden');
});

test('[block] render url avatar', function(assert) {
  assert.expect(5);

  this.render(hbs`
    {{#ko-user-avatar as |avatar|}}
      {{avatar.image url="bar.png"}}
    {{/ko-user-avatar}}
  `);

  assert.equal(this.$('.qa-avatar-loaded-false').length, 1, 'Image has not yet loaded');
  assert.equal(this.$('.qa-avatar-loading').length, 1, 'Loading placeholder visible');

  this.$('img').trigger('onload');

  assert.equal(this.$('.qa-avatar-loaded-true').length, 1, 'Image has loaded');
  assert.equal(this.$('.qa-avatar-image').attr('src'), 'bar.png', 'Image src pulled from user object');
  assert.equal(this.$('.qa-avatar-loading').length, 0, 'Loading placeholer is hidden');
});

test('[block] render the user avatar with online indicator', function(assert) {
  assert.expect(3);

  this.get('socket').connect({});

  this.set('user', EmberObject.create({
    id: 1,
    avatar: 'foo.png',
    presenceChannel: 'foo-bar'
  }));

  render.call(this, hbs`
    {{#ko-user-avatar user=user as |avatar|}}
      {{avatar.image}}
      {{avatar.online-indicator showTooltip=false}}
    {{/ko-user-avatar}}
  `);

  assert.equal(this.$('.qa-avatar-online-indicator').length, 0, 'User offline');

  simulateUserComingOnline.call(this);

  assert.equal(this.$('.qa-avatar-image').attr('src'), 'foo.png', 'Image src pulled from user object');
  assert.equal(this.$('.qa-avatar-online-indicator').length, 1, 'User online');
});

function simulateUserComingOnline() {
  this.get('socket').channel('foo-bar').trigger('presence-change', {
    1: {
      metas: [
        {
          user: {
            id: 1,
            full_name: 'Aaron Chambers',
            avatar: 'foo.png'
          }
        }
      ]
    }
  });
}

function render(template) {
  this.render(template);
  this.$('img').trigger('onload');
}

/*eslint-enable prefer-reflect */
