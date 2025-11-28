import {
  app,
  test,
} from 'frontend-cp/tests/helpers/qunit';
import toastStyles from 'frontend-cp/components/ko-toast/styles';
import modalStyles from 'frontend-cp/components/ko-modal/styles';
import fieldErrorStyles from 'frontend-cp/components/ko-form/field/errors/styles';

app('Acceptance | Manage Email Identities', {
  beforeEach() {
    server.create('permission', { name: 'agent.users.update' });
    server.create('locale', {
      id: 1,
      locale: 'en-us'
    });
    const emails = [
      server.create('identity-email', { email: 'first@example.com', is_primary: true, is_validated: true }),
      server.create('identity-email', { email: 'second@example.com', is_primary: false, is_validated: true }),
      server.create('identity-email', { email: 'third@example.com', is_primary: false, is_validated: false })
    ];
    const locale = server.create('locale', { locale: 'en-us' });
    const user = server.create('user', { emails, role: server.create('role'), locale: locale, time_zone: 'Europe/London' });
    const session = server.create('session', { user });
    server.create('plan', { limits: { agents: 20 }, features: [], account_id: '123', subscription_id: '123' });
    login(session.id);

    visit('/agent/users/' + user.id);
  },

  afterEach() {
    logout();
  }
});

test('Validate an email identity of a user', function(assert) {
  click('.ember-power-select-trigger:contains("third@example.com")');

  andThen(function() {
    assert.equal(find('.ember-power-select-option:eq(1)').text().trim(), 'Remove identity', 'The identity can be removed');
    assert.equal(find('.ember-power-select-option:eq(2)').text().trim(), 'Send verification email', 'The identity is not validated');
    click('.ember-power-select-option:contains("Send verification email")');
  });

  andThen(function() {
    assert.equal(find(`.${toastStyles.container}`).text().trim(), 'An email has been sent to your email id', 'Display a notification message');
  });
});

test('Mark an email identity of a user as validated', function(assert) {
  click('.ember-power-select-trigger:contains("third@example.com")');

  andThen(function() {
    assert.equal(find('.ember-power-select-option:eq(2)').text().trim(), 'Send verification email', 'The identity is not validated');
    assert.equal(find('.ember-power-select-option:eq(3)').text().trim(), 'Mark as verified', 'The identity is not validated');
    click('.ember-power-select-option:contains("Mark as verified")');
  });

  andThen(function() {
    assert.equal(find(`.${toastStyles.container}`).text().trim(), 'third@example.com has been verified successfully', 'Display a notification message');
  });
});

test('Mark a validate email as primary', function(assert) {
  click('.ember-power-select-trigger:contains("second@example.com")');

  andThen(function() {
    click('.ember-power-select-option:contains("Make primary")');
  });

  andThen(function() {
    assert.ok(find('.qa-identities__list--emails li:contains(second@example.com)').hasClass('qa-identity-primary'), 'The second address became the primary one');
    assert.ok(!find('.qa-identities__list--emails li:contains(first@example.com)').hasClass('qa-identity-primary'), 'That first address isn\'t the primary anymore');
  });
});

test('Remove an email', function(assert) {
  assert.expect(4);

  click('.ember-power-select-trigger:contains("second@example.com")');

  andThen(function() {
    click('.ember-power-select-option:contains("Remove identity")');
  });

  andThen(function() {
    assert.equal($(`.${modalStyles.content}`).length, 1, 'A modal opened to confirm leaving unsaved changes');
    click('.qa-ko-confirm-modal__confirm');
  });

  andThen(function() {
    assert.equal(find('.qa-identities__list--emails li:contains("first@example.com")').length, 1, 'The first email is still there');
    assert.equal(find('.qa-identities__list--emails li:contains("second@example.com")').length, 0, 'The first email is NOT there');
    assert.equal(find('.qa-identities__list--emails li:contains("third@example.com")').length, 1, 'The third email is still there');
  });
});

test('Add an invalid email identity shows an error message', function(assert) {
  selectChoose('.qa-ko-identities-create', 'Email');
  fillIn('.qa-identities__form input', 'wrong@example');
  click('.qa-identities__form button:contains("Save")');

  andThen(() => {
    assert.equal(find(`.qa-identities__form .${fieldErrorStyles.error}`).text(), 'Email format invalid');
  });
});

// test('Send validation email', function(assert) {
//   throw new Error('not implemented');
// });

app('Acceptance | Manage Twitter Identities', {
  beforeEach() {
    server.create('permission', { name: 'agent.users.update' });
    server.create('locale', {
      id: 1,
      locale: 'en-us'
    });
    const twitter = [
      server.create('identity-twitter', { screen_name: '@first', is_primary: true, is_validated: true }),
      server.create('identity-twitter', { screen_name: '@second', is_primary: false, is_validated: true }),
      server.create('identity-twitter', { screen_name: '@third', is_primary: false, is_validated: false })
    ];
    const locale = server.create('locale', { locale: 'en-us' });
    const user = server.create('user', { twitter, role: server.create('role'), locale: locale, time_zone: 'Europe/London' });
    const session = server.create('session', { user });
    server.create('plan', { limits: { agents: 20 }, features: [], account_id: '123', subscription_id: '123' });
    login(session.id);

    visit('/agent/users/' + user.id);
  },

  afterEach() {
    logout();
  }
});

test('Mark a validate twitter as primary', function(assert) {
  click('.ember-power-select-trigger:contains("@second")');

  andThen(function() {
    click('.ember-power-select-option:contains("Make primary")');
  });

  andThen(function() {
    assert.ok(find('.qa-identities__list--twitters li:contains(@second)').hasClass('qa-identity-primary'), 'The second address became the primary one');
    assert.ok(!find('.qa-identities__list--twitters li:contains(@first)').hasClass('qa-identity-primary'), 'That first address isn\'t the primary anymore');
  });
});

test('Remove a twitter identity', function(assert) {
  assert.expect(4);
  click('.ember-power-select-trigger:contains("@second")');

  andThen(function() {
    click('.ember-power-select-option:contains("Remove identity")');
  });

  andThen(function() {
    assert.equal($(`.${modalStyles.content}`).length, 1, 'A modal opened to confirm leaving unsaved changes');
    click('.qa-ko-confirm-modal__confirm');
  });

  andThen(function() {
    assert.equal(find('.qa-identities__list--twitters li:contains("@first")').length, 1, 'The first twitter is still there');
    assert.equal(find('.qa-identities__list--twitters li:contains("@second")').length, 0, 'The first twitter is NOT there');
    assert.equal(find('.qa-identities__list--twitters li:contains("@third")').length, 1, 'The third twitter is still there');
  });
});

app('Acceptance | Manage Facebook Identities', {
  beforeEach() {
    server.create('locale', {
      id: 1,
      locale: 'en-us'
    });
    const facebook = [
      server.create('identity-facebook', { user_name: 'Mike', is_primary: true, is_validated: true }),
      server.create('identity-facebook', { user_name: 'Mary', is_primary: false, is_validated: true }),
      server.create('identity-facebook', { user_name: 'John', is_primary: false, is_validated: false })
    ];
    const locale = server.create('locale', { locale: 'en-us' });
    const user = server.create('user', { facebook, role: server.create('role'), locale: locale, time_zone: 'Europe/London' });
    const session = server.create('session', { user });
    server.create('plan', { limits: { agents: 20 }, features: [], account_id: '123', subscription_id: '123' });
    login(session.id);

    visit('/agent/users/' + user.id);
  },

  afterEach() {
    logout();
  }
});

test('Mark a validate facebook as primary', function(assert) {
  click('.ember-power-select-trigger:contains("Mary")');

  andThen(function() {
    click('.ember-power-select-option:contains("Make primary")');
  });

  andThen(function() {
    assert.ok(find('.qa-identities__list--facebooks li:contains(Mary)').hasClass('qa-identity-primary'), 'The second address became the primary one');
    assert.ok(!find('.qa-identities__list--facebooks li:contains(Mike)').hasClass('qa-identity-primary'), 'That first address isn\'t the primary anymore');
  });
});

test('Remove a facebook identity', function(assert) {
  assert.expect(4);

  click('.ember-power-select-trigger:contains("Mary")');

  andThen(function() {
    click('.ember-power-select-option:contains("Remove identity")');
  });

  andThen(function() {
    assert.equal($(`.${modalStyles.content}`).length, 1, 'A modal opened to confirm leaving unsaved changes');
    click('.qa-ko-confirm-modal__confirm');
  });

  andThen(function() {
    assert.equal(find('.qa-identities__list--facebooks li:contains("Mike")').length, 1, 'The first facebook is still there');
    assert.equal(find('.qa-identities__list--facebooks li:contains("Mary")').length, 0, 'The first facebook is NOT there');
    assert.equal(find('.qa-identities__list--facebooks li:contains("John")').length, 1, 'The third facebook is still there');
  });
});

app('Acceptance | Manage Phone Identities', {
  beforeEach() {
    server.create('permission', { name: 'agent.users.update' });
    server.create('locale', {
      id: 1,
      locale: 'en-us'
    });
    const phones = [
      server.create('identity-phone', { number: '+44 1111 111111', is_primary: true, is_validated: true }),
      server.create('identity-phone', { number: '+44 2222 222222', is_primary: false, is_validated: true }),
      server.create('identity-phone', { number: '+44 3333 333333', is_primary: false, is_validated: false })
    ];
    const locale = server.create('locale', { locale: 'en-us' });
    const user = server.create('user', { phones, role: server.create('role'), locale: locale, time_zone: 'Europe/London' });
    const session = server.create('session', { user });
    server.create('plan', { limits: { agents: 20 }, features: [], account_id: '123', subscription_id: '123' });
    login(session.id);

    visit('/agent/users/' + user.id);
  },

  afterEach() {
    logout();
  }
});

test('Mark a validate phone as primary', function(assert) {
  click('.ember-power-select-trigger:contains("+44 2222 222222")');

  andThen(function() {
    click('.ember-power-select-option:contains("Make primary")');
  });

  andThen(function() {
    assert.ok(find('.qa-identities__list--phones li:contains(+44 2222 222222)').hasClass('qa-identity-primary'), 'The second address became the primary one');
    assert.ok(!find('.qa-identities__list--phones li:contains(+44 1111 111111)').hasClass('qa-identity-primary'), 'That first address isn\'t the primary anymore');
  });
});

test('Remove a phone identity', function(assert) {
  assert.expect(4);

  click('.ember-power-select-trigger:contains("+44 2222 222222")');

  andThen(function() {
    click('.ember-power-select-option:contains("Remove identity")');
  });

  andThen(function() {
    assert.equal($(`.${modalStyles.content}`).length, 1, 'A modal opened to confirm leaving unsaved changes');
    click('.qa-ko-confirm-modal__confirm');
  });

  andThen(function() {
    assert.equal(find('.qa-identities__list--phones li:contains("+44 1111 111111")').length, 1, 'The first phone is still there');
    assert.equal(find('.qa-identities__list--phones li:contains("+44 2222 222222")').length, 0, 'The first phone is NOT there');
    assert.equal(find('.qa-identities__list--phones li:contains("+44 3333 333333")').length, 1, 'The third phone is still there');
  });
});
