/* eslint-disable camelcase, new-cap */

import {
  app
} from 'frontend-cp/tests/helpers/qunit';

app('Acceptance | Organization | Create organization', {
  beforeEach() {
    const locale = server.create('locale');
    const brand = server.create('brand', { locale });
    const caseFields = server.createList('case-field', 4);
    const mailbox = server.create('mailbox', { brand });
    server.create('channel', { account: { id: mailbox.id, resource_type: 'mailbox' } });
    server.create('case-form', {
      fields: caseFields,
      brand: brand
    });
    const roles = [
      server.create('role'),
      server.create('role', {title: 'Agent', type: 'AGENT', id: 2})
      // server.create('role', {title: 'Collaborator', type: 'COLLABORATOR', id: 3}),
      // server.create('role', {title: 'Customer', type: 'CUSTOMER', id: 4})
    ];
    const agentRole = roles[1];
    const agent = server.create('user', { role: agentRole, locale: locale, time_zone: 'Europe/London' });
    const session = server.create('session', { user: agent });
    login(session.id);

    server.create('plan', { limits: { agents: 20 }, features: [], account_id: '123', subscription_id: '123' });
  },

  afterEach() {
    logout();
  }
});

// This test is failing randomly, need to find out what is causing this strange fail
// https://travis-ci.com/kayako/frontend-cp/builds/18413801 - example of failing error.
//test('Creating a organization using the "+" button in the main header', function(assert) {
//  visit('/agent');
//
//  click('.ko-agent-dropdown__add-icon');
//
//  andThen(function() {
//    assert.equal(find('.ko-agent-dropdown__drop').length, 1, '"+" Dropdown content should be visible');
//    click('.ko-agent-dropdown__nav-item:eq(2)');
//  });
//
//  andThen(function() {
//    fillIn('.ko-agent-dropdown__drop input[name=name]', 'Gadisa');
//    fillIn('.ko-agent-dropdown__drop .ko-tags__input', 'gadisa.com');
//    triggerEvent('.ko-agent-dropdown__drop .ko-tags__input', 'blur');
//    click('.qa-agent-dropdown-create-organization__submit');
//  });
//
//  andThen(function() {
//    assert.equal(currentURL(), '/agent/organizations/1', 'We are in the show page of the created user');
//    assert.equal(find('.ko-agent-dropdown__drop').length, 0, false, '"+" Dropdown content should be hidden');
//    assert.equal(find('.ko-organization-content__header-title').text().trim(), 'Gadisa', 'The name of the organization is vissible in the header');
//    assert.equal(find('.breadcrumbs .breadcrumbs__item:eq(0)').text().trim(), 'Gadisa', 'Breadcrumbs are correct');
//    assert.equal(find('.nav-tabs__item').length, 1, 'There is only one tab');
//    assert.equal(find('.nav-tabs__item.active').length, 1, 'That tab is active');
//    assert.equal(find('.nav-tabs__item').text().trim(), 'Gadisa', 'That tab belongs to the created organization');
//  });
//});
