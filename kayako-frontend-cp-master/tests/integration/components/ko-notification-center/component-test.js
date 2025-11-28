import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import startMirage from 'frontend-cp/tests/helpers/setup-mirage-for-integration';
import translations from 'frontend-cp/locales/en-us';
import { getOwner } from '@ember/application';
import StubClient from 'ember-launch-darkly/test-support/helpers/launch-darkly-client-test';
import { click } from 'ember-native-dom-helpers';
import $ from 'jquery';

function handleNotificationsAPI(server) {
  server.get('/api/v1/notifications', (schema, req) => {
    const agent = server.create('user');
    const user = server.create('user');

    const note = server.create('note');
    note.user = { id: agent.id, resource_type: 'user' };

    const activityActor = server.create('activity-actor', agent);
    activityActor.full_title = agent.full_name;
    activityActor.title = agent.full_name;
    activityActor.original = agent;

    const activityObject = server.create('activity-object', user);
    activityObject.full_title = user.full_name;
    activityObject.title = user.full_name;
    activityObject.original = user;

    const activityResult = server.create('activity-result', user);
    activityResult.full_title = note.body_text;
    activityResult.title = note.body_text;
    activityResult.original = note;

    const action = server.create('action');

    let activityData = server.create('activity', {
      activity: 'create_user_note',
      actor: activityActor,
      verb: 'NOTE',
      note: note,
      summary: `<@https://brewfictus.kayako.com/Base/User/${agent.id}|${agent.full_name}> added a note on <@https://jay.kayako.com/Base/User/${user.id}|${user.full_name}>`,
      actions: [ action ],
      object: activityObject,
      result: activityResult,
      resource_type: 'activity'
    });

    const now = new Date();

    const notifications = [];

    notifications.push(server.create('notification', {
      activity: activityData,
      created_at: now,
      updated_at: now,
      read_state: 'UNSEEN'
    }));
    notifications.push(server.create('notification', {
      activity: activityData,
      created_at: now,
      updated_at: now,
      read_state: 'READ'
    }));
    notifications.push(server.create('notification', {
      activity: activityData,
      created_at: now,
      updated_at: now,
      read_state: 'SEEN'
    }));
    notifications.push(server.create('notification', {
      activity: activityData,
      created_at: now,
      updated_at: now,
      read_state: 'UNSEEN'
    }));

    const activityResource = {};
    activityResource[activityData.id] = activityData;

    return {
      status: 200,
      resource: 'notification',
      data: notifications,
      resources: {
        activity: activityResource
      }
    };
  });

  server.put('/api/v1/notifications/:id', (schema, req) => {
    return { status: 200 };
  });
}

let intlService;

moduleForComponent('ko-notification-center', 'Integration | Component | ko notification center', {
  integration: true,

  setup() {
    intlService = getOwner(this).lookup('service:intl');
    intlService.setLocale('en-us');
    intlService.addTranslations('en-us', translations);
  },

  beforeEach() {
    startMirage(this.container);
    this.register('service:launch-darkly-client', StubClient);
    this.inject.service('launch-darkly-client', { as: 'launchDarklyClient' });
  }
});

test('Renders notifications correctly', async function(assert) {
  this.get('launchDarklyClient').enable('release-notification-centre-improvements');
  handleNotificationsAPI(server);

  this.render(hbs`{{ko-notification-center}}`);
  await click('.qa-notification-center--trigger');
  assert.equal($('.qa-notification-center--item').length, 4, 'All notifications are rendered');  // `4` notifications were returned from the notifications API handler here.
  assert.equal($('.qa-notification-center--item--seen').length, 1, 'The number of seen notifications are correct');  // `1` notification returned in the above handler is `SEEN`.
  assert.equal($('.qa-notification-center--item:not(.qa-notification-center--item--seen)').length, 3, 'The number of unseen notifications are correct');  // `3` notifications returned in the above handler are `READ or UNSEEN`.
});

test('Can mark notification as read', async function(assert) {
  this.get('launchDarklyClient').enable('release-notification-centre-improvements');
  handleNotificationsAPI(server);

  this.render(hbs`{{ko-notification-center}}`);
  await click('.qa-notification-center--trigger');
  await click('.qa-notification-center--item:first-of-type .qa-notification-center--read');
  assert.equal($('.qa-notification-center--item').length, 4, 'All notifications are rendered');
  assert.equal($('.qa-notification-center--item--seen').length, 2, 'The number of seen notifications are correct');
  assert.equal($('.qa-notification-center--item:not(.qa-notification-center--item--seen)').length, 2, 'The number of unseen notifications are correct');
  assert.ok($('.qa-notification-center--item:eq(1)').hasClass('qa-notification-center--item--seen'), 'The intended notification is updated');
});
