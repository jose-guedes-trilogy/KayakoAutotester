import { moduleForComponent, test } from 'ember-qunit';
import EmberObject from '@ember/object';
import StubLocalStorage from 'frontend-cp/tests/helpers/mock-local-store';
import hbs from 'htmlbars-inline-precompile';
import moment from 'moment';
import { resolve } from 'rsvp';

moduleForComponent('app-version-notifier', 'Integration | Component | app version notifier', {
  integration: true,
  beforeEach() {
    this.register('service:local-store', new StubLocalStorage(), { instantiate: false });
    this.inject.service('local-store', { as: 'localStorage' });

    this.inject.service('cookies', { as: 'cookies' });
    const StubLocale = EmberObject.extend({
      setup() {
        return resolve();
      }
    });
    this.register('service:locale', StubLocale);
    this.inject.service('locale', { as: 'locale' });
  }
});

test('no appVersion specified', function(assert) {
  assert.expect(1);

  this.render(hbs`{{app-version-notifier activeVersion="111111"}}`);

  assert.equal(this.$('.qa-app-version-notifier').length, 0, 'Notification is not displayed');
});

test('no activeVersion specified', function(assert) {
  assert.expect(1);

  this.render(hbs`{{app-version-notifier appVersion="111111"}}`);

  assert.equal(this.$('.qa-app-version-notifier').length, 0, 'Notification is not displayed');
});

test('appVersion is the same as the activeVersion', function(assert) {
  assert.expect(1);

  this.render(hbs`{{app-version-notifier appVersion="111111" activeVersion="111111"}}`);

  assert.equal(this.$('.qa-app-version-notifier').length, 0, 'Notification is not displayed');
});

test('appVersion is different from the activeVersion', function (assert) {
  assert.expect(1);

  this.render(hbs`{{app-version-notifier appVersion="111111" activeVersion="222222"}}`);

  assert.equal(this.$('.qa-app-version-notifier').length, 1, 'Notification is displayed');
});

test('appVersion is different from the activeVersion but is a lightning preview', function(assert) {
  assert.expect(1);

  const dropLightningPreviewCookie = () => {
    this.get('cookies').read = () => { return 'cheese'; };
  };

  dropLightningPreviewCookie();

  this.render(hbs`{{app-version-notifier appVersion="111111" activeVersion="222222"}}`);

  assert.equal(this.$('.qa-app-version-notifier').length, 0, 'Notification is not displayed');
});

test('will notify when the activeVersion changes', function(assert) {
  assert.expect(2);

  this.set('activeVersion', '111111');

  this.render(hbs`{{app-version-notifier appVersion="111111" activeVersion=activeVersion}}`);

  assert.equal(this.$('.qa-app-version-notifier').length, 0, 'Notification is not displayed');

  this.set('activeVersion', '222222');

  assert.equal(this.$('.qa-app-version-notifier').length, 1, 'Notification is displayed when active version changes');
});

test('continues to notify when the activeVersion changes multiple times', function(assert) {
  assert.expect(2);

  this.set('activeVersion', '222222');

  this.render(hbs`{{app-version-notifier appVersion="111111" activeVersion=activeVersion notificationFrequency=1}}`);

  assert.equal(this.$('.qa-app-version-notifier').length, 1, 'Notification is displayed');

  this.set('activeVersion', '333333');

  assert.equal(this.$('.qa-app-version-notifier').length, 1, 'Notification is still displayed when active version changes');
});

test('removes notification if the activeVersion changes to be the same as the appVersion', function(assert) {
  assert.expect(2);

  this.set('activeVersion', '222222');

  this.render(hbs`{{app-version-notifier appVersion="111111" activeVersion=activeVersion notificationFrequency=1}}`);

  assert.equal(this.$('.qa-app-version-notifier').length, 1, 'Notification is displayed');

  this.set('activeVersion', '111111');

  assert.equal(this.$('.qa-app-version-notifier').length, 0, 'Notification is removed when active version changes to be the same as appVersion');
});

test('respects notification frequency if provided', function(assert) {
  assert.expect(9);

  const recordLastNotifiedInLocalStorage = ({ version, hoursAgo }) => {
    this.get('localStorage').setItem('app-version-notifier', 'v1', { version, lastNotifiedAt: moment().subtract(hoursAgo, 'hours').toISOString() });
  };

  const retrieveLastNotifiedVersionFromLocalStorage = () => {
    let data = this.get('localStorage').getItem('app-version-notifier', 'v1');
    return data && data.version;
  };

  this.set('appVersion', '111111');
  this.set('activeVersion', '111111');

  this.render(hbs`{{app-version-notifier appVersion=appVersion activeVersion=activeVersion notificationFrequency=1}}`);

  assert.equal(this.$('.qa-app-version-notifier').length, 0, 'Notification is not displayed');
  assert.equal(this.get('localStorage').getItem('app-version-notifier:v1'), undefined, 'User has never been notified before');

  this.set('activeVersion', '222222');

  assert.equal(this.$('.qa-app-version-notifier').length, 1, 'Notification is displayed after new version was deployed');
  assert.equal(retrieveLastNotifiedVersionFromLocalStorage(), '222222', 'Last notified was saved to local storage');

  this.set('appVersion', '222222');

  assert.equal(this.$('.qa-app-version-notifier').length, 0, 'Notification is removed after appVersion is updated to the same as activeVersion');

  this.set('activeVersion', '333333');

  assert.equal(this.$('.qa-app-version-notifier').length, 0, 'Notification is not displayed due to still being within specified notification frequency');
  assert.equal(retrieveLastNotifiedVersionFromLocalStorage(), '222222', 'Last notified has not been updated in local storage');

  recordLastNotifiedInLocalStorage({ version: '222222', hoursAgo: 4 });

  this.set('activeVersion', '444444');

  assert.equal(this.$('.qa-app-version-notifier').length, 1, 'Notification is displayed due to being outside specified notification frequency');
  assert.equal(retrieveLastNotifiedVersionFromLocalStorage(), '444444', 'Last notified has not been updated in local storage');
});
