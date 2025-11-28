import { camelize } from '@ember/string';
import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import startMirage from 'frontend-cp/tests/helpers/setup-mirage-for-integration';
import translations from 'frontend-cp/locales/en-us';
import wait from 'ember-test-helpers/wait';
import { nativeMouseDown as click } from 'frontend-cp/tests/helpers/ember-power-select';
import { getOwner } from '@ember/application';

const camelizeRecordArray = function (recordArray) {
  return recordArray.map(record => {
    let camelizedRecordObject = {};

    Object.keys(record).forEach((key) => {
      camelizedRecordObject[camelize(key)] = record[key];
    });

    return camelizedRecordObject;
  });
};

const getRelativeTimeInThePast = function (offset) {
  const TIME_NOW = (new Date()).getTime();
  return new Date(TIME_NOW - offset);
};

let user, kase, intlService;

const MINUTE = 60000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const ITEMS_TO_SHOW = 8;

const generateUserAndCases = function (count) {
  const adminRole = server.create('role', { type: 'ADMIN' });
  const locale = server.create('locale', { locale: 'en-us' });

  let activeCases = camelizeRecordArray(server.createList('case', count));
  user = server.create('user', { role: adminRole, locale });
  user.activeCases = activeCases;
  user.recentCases = activeCases;
};

const customActiveCasesScenario = function (includeActiveCase, includeInactiveCase, limitCases) {
  const adminRole = server.create('role', { type: 'ADMIN' });
  const locale = server.create('locale', { locale: 'en-us' });
  const agentRole = server.create('role', { title: 'Agent', type: 'AGENT', id: 2 });
  const customerRole = server.create('role', { title: 'Agent', type: 'CUSTOMER', id: 4 });
  const statuses = [
    server.create('case-status', { statusType: 'NEW', label: 'New' }),
    server.create('case-status', { statusType: 'OPEN', label: 'Open' }),
    server.create('case-status', { statusType: 'PENDING', label: 'Pending' }),
    server.create('case-status', { statusType: 'COMPLETED', label: 'Completed' }),
    server.create('case-status', { statusType: 'CLOSED', label: 'Closed '})
  ];

  let requester = server.create('user', {
    role: customerRole,
    locale,
    time_zone: 'Europe/London'
  });

  let creator = server.create('user', {
    role: agentRole,
    locale,
    time_zone: 'Europe/London'
  });

  let teamGeneral = server.create('team', {
    title: 'General'
  });

  let teamFrontline = server.create('team', {
    title: 'Frontline'
  });

  user = server.create('user', { role: adminRole, locale });

  user.activeCases = [
    server.create('case', {
      subject: 'This is case 1',
      requester, creator,
      status: statuses[0],
      updatedAt: getRelativeTimeInThePast(2 * MINUTE)
    }),
    server.create('case', {
      subject: 'This is case 2',
      requester, creator,
      assignedAgent: { id: creator.id, fullName: 'Agent Name' },
      assignedTeam: teamGeneral,
      status: statuses[1],
      updatedAt: getRelativeTimeInThePast(10 * MINUTE)
    }),
    server.create('case', {
      subject: 'This is case 3',
      requester: user, creator,
      assignedAgent: { id: creator.id },
      assignedTeam: teamFrontline,
      status: statuses[2],
      updatedAt: getRelativeTimeInThePast(70 * MINUTE)
    }),
    server.create('case', {
      subject: 'This is case 4',
      requester: user, creator,
      assignedAgent: { id: user.id },
      status: statuses[0],
      updatedAt: getRelativeTimeInThePast(2 * DAY)
    }),
    server.create('case', {
      subject: 'This is case 5',
      requester, creator: user,
      assignedAgent: { id: user.id },
      status: statuses[1],
      updatedAt: getRelativeTimeInThePast(6 * DAY)
    }),
    server.create('case', {
      subject: 'This is case 6',
      requester, creator,
      assignedAgent: { id: user.id },
      status: statuses[1],
      updatedAt: getRelativeTimeInThePast(9 * DAY)
    }),
    server.create('case', {
      subject: 'This is case 7',
      requester, creator,
      assignedAgent: { id: user.id },
      status: statuses[1],
      updatedAt: getRelativeTimeInThePast(9 * DAY)
    }),
    server.create('case', {
      subject: 'This is case 8',
      requester, creator,
      assignedAgent: { id: user.id },
      status: statuses[1],
      updatedAt: getRelativeTimeInThePast(9 * DAY)
    }),
    server.create('case', {
      subject: 'This is case 9',
      requester, creator,
      assignedAgent: { id: user.id },
      status: statuses[1],
      updatedAt: getRelativeTimeInThePast(9 * DAY)
    }),
    server.create('case', {
      subject: 'This is case 10',
      requester, creator,
      assignedAgent: { id: user.id },
      status: statuses[1],
      updatedAt: getRelativeTimeInThePast(9 * DAY)
    }),
    server.create('case', {
      subject: 'This is case 11',
      requester, creator,
      assignedAgent: { id: user.id },
      status: statuses[1],
      updatedAt: getRelativeTimeInThePast(9 * DAY)
    }),
    server.create('case', {
      subject: 'This is case 12',
      requester, creator,
      assignedAgent: { id: user.id },
      status: statuses[1],
      updatedAt: getRelativeTimeInThePast(9 * DAY)
    }),
    server.create('case', {
      subject: 'This is case 13',
      requester, creator,
      assignedAgent: { id: user.id },
      status: statuses[1],
      updatedAt: getRelativeTimeInThePast(9 * DAY)
    }),
    server.create('case', {
      subject: 'This is case 14',
      requester, creator,
      assignedAgent: { id: user.id },
      status: statuses[1],
      updatedAt: getRelativeTimeInThePast(9 * DAY)
    }),
    server.create('case', {
      subject: 'This is case 15',
      requester, creator,
      assignedAgent: { id: user.id },
      status: statuses[1],
      updatedAt: getRelativeTimeInThePast(9 * DAY)
    }),
    server.create('case', {
      subject: 'This is case 16',
      requester, creator,
      assignedAgent: { id: user.id },
      status: statuses[1],
      updatedAt: getRelativeTimeInThePast(9 * DAY)
    }),
    server.create('case', {
      subject: 'This is case 17',
      requester, creator,
      assignedAgent: { id: user.id },
      status: statuses[1],
      updatedAt: getRelativeTimeInThePast(9 * DAY)
    }),
    server.create('case', {
      subject: 'This is case 18',
      requester, creator,
      assignedAgent: { id: user.id },
      status: statuses[1],
      updatedAt: getRelativeTimeInThePast(9 * DAY)
    }),
    server.create('case', {
      subject: 'This is case 19',
      requester, creator,
      assignedAgent: { id: user.id },
      status: statuses[1],
      updatedAt: getRelativeTimeInThePast(9 * DAY)
    }),
    server.create('case', {
      subject: 'This is case 20',
      requester, creator,
      assignedAgent: { id: user.id },
      status: statuses[1],
      updatedAt: getRelativeTimeInThePast(9 * DAY)
    })
  ];

  if (includeActiveCase) {
    kase = user.activeCases[0];
  }
  else if (includeInactiveCase) {
    kase = server.create('case', {
      subject: 'This is case X',
      requester, creator,
      assignedAgent: { id: user.id },
      status: statuses[5],
      updatedAt: getRelativeTimeInThePast(9 * DAY)
    });
  }
  if (limitCases) {
    user.activeCases = user.activeCases.slice(0, limitCases);
  }

  user.recentCases = user.activeCases;
};

moduleForComponent('ko-user-cases', 'integration | Component | ko user cases', {
  integration: true,

  setup() {
    intlService = getOwner(this).lookup('service:intl');
    intlService.setLocale('en-us');
    intlService.addTranslations('en-us', translations);
  },

  beforeEach() {
    startMirage(this.container);
  },

  afterEach() {
    window.server.shutdown();
  }
});

test(`it renders ${ITEMS_TO_SHOW} cases and shows total count when more than ${ITEMS_TO_SHOW} cases are present`, function (assert) {
  generateUserAndCases(50);
  this.set('user', user);

  this.render(hbs`{{ko-user-cases user=user}}`);
  click('.qa-active-cases--trigger');

  return wait().then(() => {
    assert.ok(this.$('.qa-active-cases--count').text().includes(50), 'Link text contains correct test count.');
    assert.equal(this.$('.qa-active-cases--item').length, ITEMS_TO_SHOW, `${ITEMS_TO_SHOW} items are shown when more than ${ITEMS_TO_SHOW} activeCases are present.`);
  });

});

test(`it renders ${ITEMS_TO_SHOW} cases and shows no count text-link when ${ITEMS_TO_SHOW} cases are present`, function (assert) {
  generateUserAndCases(ITEMS_TO_SHOW);
  this.set('user', user);

  this.render(hbs`{{ko-user-cases user=user}}`);
  click('.qa-active-cases--trigger');

  return wait().then(() => {
    assert.equal(this.$('.qa-active-cases--count').length, 0, 'Count text/link not visible.');
    assert.equal(this.$('.qa-active-cases--item').length, ITEMS_TO_SHOW, `${ITEMS_TO_SHOW} items are shown when ${ITEMS_TO_SHOW} activeCases are present.`);
  });
});

test(`it renders ${ITEMS_TO_SHOW - 1} cases and shows no count text-link when ${ITEMS_TO_SHOW - 1} cases are present`, function (assert) {
  generateUserAndCases(ITEMS_TO_SHOW - 1);
  this.set('user', user);

  this.render(hbs`{{ko-user-cases user=user}}`);
  click('.qa-active-cases--trigger');

  return wait().then(() => {
    assert.equal(this.$('.qa-active-cases--count').length, 0, 'Count text/link not visible.');
    assert.equal(this.$('.qa-active-cases--item').length, ITEMS_TO_SHOW - 1, `${ITEMS_TO_SHOW - 1} items are shown when ${ITEMS_TO_SHOW - 1} activeCases are present.`);
  });
});

test('it does not show the trigger when no cases are present', function (assert) {
  generateUserAndCases(0);
  this.set('user', user);

  this.render(hbs`{{ko-user-cases user=user}}`);

  return wait().then(() => {
    assert.equal(this.$('.qa-active-cases--trigger').length, 0, 'Trigger not visible.');
  });
});

test('it checks that all required dynamic parts of the components are working', function (assert) {
  customActiveCasesScenario();
  this.set('user', user);

  this.render(hbs`{{ko-user-cases user=user}}`);
  click('.qa-active-cases--trigger');

  return wait().then(() => {
    const item1 = this.$('.qa-active-cases--item:eq(0)');
    const item2 = this.$('.qa-active-cases--item:eq(1)');
    const item3 = this.$('.qa-active-cases--item:eq(2)');

    assert.equal(this.$('.qa-active-cases--count').length, 1, 'Count text/link is visible.');
    assert.equal(this.$('.qa-active-cases--item').length, ITEMS_TO_SHOW, `${ITEMS_TO_SHOW} items are shown when more than ${ITEMS_TO_SHOW} activeCases are present.`);
    assert.ok(this.$('.qa-active-cases--count').text().includes(user.recentCases.length), 'Link text contains correct test count.');

    assert.equal(item1.find('.qa-active-cases--subject').text().trim(), 'This is case 1', 'Subject 1 is what is expected');
    assert.ok(item1.find('.qa-active-cases--assignee').text().includes('(Unassigned)'), 'Agent Team 1 is what is expected');
    assert.equal(item1.find('.qa-active-cases--status').text(), 'New', 'Status 1 is what is expected');
    assert.equal(item1.find('.qa-active-cases--updated-time').text().trim(), '2m', 'UpdateAt time 1 is what is expected');

    assert.equal(item2.find('.qa-active-cases--subject').text().trim(), 'This is case 2', 'Subject 2 is what is expected');
    assert.ok(item2.find('.qa-active-cases--assignee').text().includes('Agent'), 'Agent Team 2 is what is expected');
    assert.equal(item2.find('.qa-active-cases--status').text(), 'Open', 'Status 2 is what is expected');
    assert.equal(item2.find('.qa-active-cases--updated-time').text().trim(), '10m', 'UpdateAt time 2 is what is expected');

    assert.equal(item3.find('.qa-active-cases--subject').text().trim(), 'This is case 3', 'Subject is 3 what is expected');
    assert.ok(item3.find('.qa-active-cases--assignee').text().includes('Frontline'), 'Agent Team is 3 what is expected');
    assert.equal(item3.find('.qa-active-cases--status').text(), 'Pending', 'Status 3 is what is expected');
    assert.equal(item3.find('.qa-active-cases--updated-time').text().trim(), '1h', 'UpdateAt time is 3 what is expected');
  });
});

test(`locale is correct for case view with current case being inactive for ${ITEMS_TO_SHOW + 3} or more cases`, function (assert) {
  customActiveCasesScenario(false, true);
  this.set('user', user);
  this.set('case', kase);

  this.render(hbs`{{ko-user-cases user=user case=case}}`);
  click('.qa-active-cases--trigger');

  return wait().then(() => {
    const triggerText = this.$('.qa-active-cases--trigger-text').text().trim();
    const countText = this.$('.qa-active-cases--count').text().trim();

    assert.equal(triggerText, ITEMS_TO_SHOW + '+ active conversations');
    assert.equal(countText, `Find all ${user.recentCases.length} conversations`);
  });
});

test(`locale is correct for case view with current case being active for ${ITEMS_TO_SHOW + 3} or more cases`, function (assert) {
  customActiveCasesScenario(true);
  this.set('user', user);
  this.set('case', kase);

  this.render(hbs`{{ko-user-cases user=user case=case}}`);
  click('.qa-active-cases--trigger');

  return wait().then(() => {
    const triggerText = this.$('.qa-active-cases--trigger-text').text().trim();
    const countText = this.$('.qa-active-cases--count').text().trim();

    assert.equal(triggerText, ITEMS_TO_SHOW + '+ other active conversations');
    assert.equal(countText, `Find all ${user.recentCases.length} conversations`);
  });
});

test(`locale is correct for case view with current case being inactive for ${ITEMS_TO_SHOW + 2} or more cases`, function (assert) {
  customActiveCasesScenario(false, true, ITEMS_TO_SHOW + 2);
  this.set('user', user);
  this.set('case', kase);

  this.render(hbs`{{ko-user-cases user=user case=case}}`);
  click('.qa-active-cases--trigger');

  return wait().then(() => {
    const triggerText = this.$('.qa-active-cases--trigger-text').text().trim();
    const countText = this.$('.qa-active-cases--count').text().trim();

    assert.equal(triggerText, ITEMS_TO_SHOW + '+ active conversations');
    assert.equal(countText, `Find all ${user.recentCases.length} conversations`);
  });
});

test(`locale is correct for case view with current case being inactive for ${ITEMS_TO_SHOW + 2} or more cases`, function (assert) {
  customActiveCasesScenario(true, false, ITEMS_TO_SHOW + 2);
  this.set('user', user);
  this.set('case', kase);

  this.render(hbs`{{ko-user-cases user=user case=case}}`);
  click('.qa-active-cases--trigger');

  return wait().then(() => {
    const triggerText = this.$('.qa-active-cases--trigger-text').text().trim();
    const countText = this.$('.qa-active-cases--count').text().trim();

    assert.equal(triggerText, ITEMS_TO_SHOW + '+ other active conversations');
    assert.equal(countText, `Find all ${user.recentCases.length} conversations`);
  });
});

test(`locale is correct for case view with current case being inactive for ${ITEMS_TO_SHOW + 1} or fewer cases`, function (assert) {
  customActiveCasesScenario(false, true, ITEMS_TO_SHOW - 1);
  this.set('user', user);
  this.set('case', kase);

  this.render(hbs`{{ko-user-cases user=user case=case}}`);
  click('.qa-active-cases--trigger');

  return wait().then(() => {
    const triggerText = this.$('.qa-active-cases--trigger-text').text().trim();
    const countText = this.$('.qa-active-cases--count').length;

    assert.equal(triggerText, `${ITEMS_TO_SHOW - 1} active conversations`);
    assert.equal(countText, 0);
  });
});

test('locale is correct for case view with current case being active for 4 cases', function (assert) {
  customActiveCasesScenario(true, false, 4);
  this.set('user', user);
  this.set('case', kase);

  this.render(hbs`{{ko-user-cases user=user case=case}}`);
  click('.qa-active-cases--trigger');

  return wait().then(() => {
    const triggerText = this.$('.qa-active-cases--trigger-text').text().trim();
    const countElement = this.$('.qa-active-cases--count');

    assert.equal(triggerText, '3 other active conversations');
    assert.equal(countElement.length, 0, 'Count text element should not be visible');
  });
});

test('locale is correct for case view with current case being inactive for 2 cases', function (assert) {
  customActiveCasesScenario(false, true, 2);
  this.set('user', user);
  this.set('case', kase);

  this.render(hbs`{{ko-user-cases user=user case=case}}`);
  click('.qa-active-cases--trigger');

  return wait().then(() => {
    const triggerText = this.$('.qa-active-cases--trigger-text').text().trim();
    const countElement = this.$('.qa-active-cases--count');

    assert.equal(triggerText, '2 active conversations');
    assert.equal(countElement.length, 0, 'Count text element should not be visible');
  });
});

test('locale is correct for case view with current case being active for 2 cases', function (assert) {
  customActiveCasesScenario(true, false, 2);
  this.set('user', user);
  this.set('case', kase);

  this.render(hbs`{{ko-user-cases user=user case=case}}`);
  click('.qa-active-cases--trigger');

  return wait().then(() => {
    const triggerText = this.$('.qa-active-cases--trigger-text').text().trim();
    const countElement = this.$('.qa-active-cases--count');

    assert.equal(triggerText, '1 other active conversation');
    assert.equal(countElement.length, 0, 'Count text element should not be visible');
  });
});

test('locale is correct for case view with current case being inactive for 1 case', function (assert) {
  customActiveCasesScenario(false, true, 1);
  this.set('user', user);
  this.set('case', kase);

  this.render(hbs`{{ko-user-cases user=user case=case}}`);
  click('.qa-active-cases--trigger');

  return wait().then(() => {
    const triggerText = this.$('.qa-active-cases--trigger-text').text().trim();
    const countElement = this.$('.qa-active-cases--count');

    assert.equal(triggerText, '1 active conversation');
    assert.equal(countElement.length, 0, 'Count text element should not be visible');
  });
});

test('locale is correct for case view with current case being active for 1 case', function (assert) {
  customActiveCasesScenario(true, false, 1);
  this.set('user', user);
  this.set('case', kase);

  this.render(hbs`{{ko-user-cases user=user case=case}}`);

  return wait().then(() => {
    const triggerElement = this.$('.qa-active-cases--trigger-text');
    const countElement = this.$('.qa-active-cases--count');

    assert.equal(triggerElement.length, 0, 'Trigger element should not be visible');
    assert.equal(countElement.length, 0, 'Count text element should not be visible');
  });
});
