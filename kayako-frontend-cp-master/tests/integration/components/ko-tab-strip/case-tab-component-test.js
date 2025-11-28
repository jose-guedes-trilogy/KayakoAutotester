import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import { set } from '@ember/object';
import { run } from '@ember/runloop';
import { getOwner } from '@ember/application';
import Service from '@ember/service';
import MockSocket from 'frontend-cp/tests/helpers/mocks/socket';

const tabStoreStub = Service.extend({
  tabs: []
});

const processManagerStub = Service.extend({
  foregroundProcess: null
});

const windowStub = Service.extend({
  visible: true
});

let blurBrowser, focusBrowser, foregroundTab;

function createTab(name, unreadCount=0) {
  return {
    linkParams: ['session'],
    process: {
      type: 'case',
      model: {
        subject: name,
        realtimeChannel: `${name.toLowerCase()}-channel`,
        readMarker: {
          unreadCount
        },
        requester: {
          avatar: ''
        }
      }
    }
  };
}

function updateUnreadCount(tab, count) {
  run(() => {
    set(tab, 'process.model.readMarker.unreadCount', count);
  });
}

moduleForComponent('ko-tab-strip (case tab)', 'Integration | Component | ko tab strip (case tab)', {
  integration: true,

  beforeEach() {
    getOwner(this).lookup('router:main').setupRouter();

    this.register('service:launchDarkly', Service.extend({}));
    this.register('service:tab-store', tabStoreStub);
    this.inject.service('tab-store', { as: 'tabStore' });

    this.register('service:process-manager', processManagerStub);
    this.inject.service('process-manager', { as: 'processManager' });

    this.register('constructor:socket', MockSocket, { instantiate: false });
    this.inject.service('socket', { as: 'socket' });

    this.register('service:window', windowStub);
    this.inject.service('window', { as: 'window' });

    this.get('socket').connect({});

    blurBrowser = () => {
      this.set('window.visible', false);
    };

    focusBrowser = () => {
      this.set('window.visible', true);
    };

    foregroundTab = (tab) => {
      let process = null;

      if (tab) {
        process = tab.process;
      }

      this.set('processManager.foregroundProcess', process);
    };
  }
});

test('unread pills while browser is in focus', function(assert) {
  assert.expect(7);

  let cheeseTab = createTab('CHEESE');
  let baconTab = createTab('BACON');

  this.set('tabStore.tabs', [cheeseTab, baconTab]);

  this.render(hbs`
    {{#ko-tab-strip as |strip|}}
      {{strip.tabs}}
    {{/ko-tab-strip}}
  `);

  foregroundTab(baconTab);

  focusBrowser();

  assert.equal(this.$('.qa-case-tab:eq(0) .qa-tab-unread-count').length, 0, 'No unread count pill in background tab');
  assert.equal(this.$('.qa-case-tab:eq(1) .qa-tab-unread-count').length, 0, 'No unread count pill in foreground tab');

  updateUnreadCount(cheeseTab, 1);
  updateUnreadCount(baconTab, 1);

  assert.equal(this.$('.qa-case-tab:eq(0) .qa-tab-unread-count').length, 1, 'Unread pill displayed in background tab');
  assert.equal(this.$('.qa-case-tab:eq(0) .qa-tab-unread-count').text().trim(), '1', 'Correct unread count in background tab');
  assert.equal(this.$('.qa-case-tab:eq(1) .qa-tab-unread-count').length, 0, 'No unread count pill in foreground tab');

  foregroundTab(cheeseTab);

  assert.equal(this.$('.qa-case-tab:eq(0) .qa-tab-unread-count').length, 0, 'No unread count pill in background tab');
  assert.equal(this.$('.qa-case-tab:eq(1) .qa-tab-unread-count').length, 0, 'No unread count pill in foreground tab');
});

test('unread pills while browser is not focussed', function(assert) {
  assert.expect(8);

  let cheeseTab = createTab('CHEESE');
  let baconTab = createTab('BACON');

  this.set('tabStore.tabs', [cheeseTab, baconTab]);

  this.render(hbs`
    {{#ko-tab-strip as |strip|}}
      {{strip.tabs}}
    {{/ko-tab-strip}}
  `);

  foregroundTab(baconTab);

  blurBrowser();

  assert.equal(this.$('.qa-case-tab:eq(0) .qa-tab-unread-count').length, 0, 'No unread count pill in background tab');
  assert.equal(this.$('.qa-case-tab:eq(1) .qa-tab-unread-count').length, 0, 'No unread count pill in foreground tab');

  updateUnreadCount(cheeseTab, 1);
  updateUnreadCount(baconTab, 1);

  assert.equal(this.$('.qa-case-tab:eq(0) .qa-tab-unread-count').length, 1, 'Unread pill displayed in background tab');
  assert.equal(this.$('.qa-case-tab:eq(0) .qa-tab-unread-count').text().trim(), '1', 'Correct unread count displayed in background tab');
  assert.equal(this.$('.qa-case-tab:eq(1) .qa-tab-unread-count').length, 1, 'Unread pill displayed in foreground tab');
  assert.equal(this.$('.qa-case-tab:eq(1) .qa-tab-unread-count').text().trim(), '1', 'Correct unread count displayed in foreground tab');

  focusBrowser();

  assert.equal(this.$('.qa-case-tab:eq(0) .qa-tab-unread-count').length, 1, 'Unread pill still displayted in background tab');
  assert.equal(this.$('.qa-case-tab:eq(1) .qa-tab-unread-count').length, 0, 'Unread pill removed from foreground tab');
});

test('more than 9 new messages arrive', function(assert) {
  assert.expect(3);

  let cheeseTab = createTab('CHEESE');

  this.set('tabStore.tabs', [cheeseTab]);

  this.render(hbs`
    {{#ko-tab-strip as |strip|}}
      {{strip.tabs}}
    {{/ko-tab-strip}}
  `);

  foregroundTab(null);

  focusBrowser();

  assert.equal(this.$('.qa-case-tab:eq(0) .qa-tab-unread-count').length, 0, 'No unread count pill');

  updateUnreadCount(cheeseTab, 9);

  assert.equal(this.$('.qa-case-tab:eq(0) .qa-tab-unread-count').text().trim(), '9', 'Correct unread count <= 9 displayed');

  updateUnreadCount(cheeseTab, 10);

  assert.equal(this.$('.qa-case-tab:eq(0) .qa-tab-unread-count').text().trim(), '9+', 'Correct unread count > 9 displayed');
});
