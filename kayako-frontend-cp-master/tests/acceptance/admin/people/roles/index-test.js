import {
  app,
  test,
} from 'frontend-cp/tests/helpers/qunit';

import rowStyles from 'frontend-cp/components/ko-simple-list/row/styles';

app('Acceptance | admin/team-settings/roles index', {
  beforeEach() {
    server.create('locale', {
      locale: 'en-us',
      isDefault: true
    });

    server.create('plan', { limits: { agents: 20 }, features: [], account_id: '123', subscription_id: '123' });

    server.create('role', {
      id: 2,
      type: 'AGENT',
      title: 'Agent'
    });

    server.create('role', {
      id: 3,
      type: 'COLLABORATOR',
      title: 'Collaborator'
    });

    server.create('role', {
      id: 4,
      type: 'CUSTOMER',
      title: 'Customer'
    });

    server.create('role', {
      id: 5,
      type: 'OWNER',
      title: 'Owner'
    });

    server.create('role', {
      id: 6,
      type: 'CUSTOMER',
      title: 'Custom Role',
      is_system: false
    });

    const adminRole = server.create('role', {
      id: 1,
      type: 'ADMIN',
      title: 'Administrator'
    });

    const locale = server.create('locale', { locale: 'en-us' });
    const agent = server.create('user', { role: adminRole, locale: locale, time_zone: 'Europe/London' });
    const session = server.create('session', { user: agent });
    login(session.id);
  },

  afterEach() {
    logout();
  }
});

test('reading the roles list', function(assert) {
  visit('/admin/team-settings/roles');

  andThen(function() {
    const textFor = function(item, elementClass) {
      const element = $(item).find(`.qa-ko-admin_roles_list-item__${elementClass}`);
      return element.length > 0 ? element.text().trim() : null;
    };

    const getRowData = (index) => {
      const item = find(`.qa-ko-admin_roles__list-item:eq(${index})`);
      return {
        title: textFor(item, 'title'),
        caption: textFor(item, 'title-caption'),
        label: textFor(item, 'label'),
        editLink: textFor(item, 'edit'),
        deleteLink: textFor(item, 'delete')
      };
    };

    triggerEvent(`.${rowStyles.row}:eq(0)`, 'mouseenter');
    andThen(() => {
      assert.deepEqual(getRowData(0), {
        title: 'Administrator',
        caption: '(System)',
        label: 'Administrator',
        editLink: 'Edit',
        deleteLink: null
      });
    });

    triggerEvent(`.${rowStyles.row}:eq(1)`, 'mouseenter');
    andThen(() => {
      assert.deepEqual(getRowData(1), {
        title: 'Agent',
        caption: '(System)',
        label: 'Agent',
        editLink: 'Edit',
        deleteLink: null
      });
    });

    triggerEvent(`.${rowStyles.row}:eq(2)`, 'mouseenter');
    andThen(() => {
      assert.deepEqual(getRowData(2), {
        title: 'Collaborator',
        caption: '(System)',
        label: 'Collaborator',
        editLink: null,
        deleteLink: null
      });
    });

    triggerEvent(`.${rowStyles.row}:eq(3)`, 'mouseenter');
    andThen(() => {
      assert.deepEqual(getRowData(3), {
        title: 'Customer',
        caption: '(System)',
        label: 'Customer',
        editLink: null,
        deleteLink: null
      });
    });

    triggerEvent(`.${rowStyles.row}:eq(4)`, 'mouseenter');
    andThen(() => {
      assert.deepEqual(getRowData(4), {
        title: 'Owner',
        caption: '(System)',
        label: 'Owner',
        editLink: null,
        deleteLink: null
      });
    });

    triggerEvent(`.${rowStyles.row}:eq(5)`, 'mouseenter');
    andThen(() => {
      assert.deepEqual(getRowData(5), {
        title: 'Custom Role',
        caption: null,
        label: 'Customer',
        editLink: 'Edit',
        deleteLink: 'Delete'
      });
    });
  });
});
