import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import { getOwner } from '@ember/application';
import Service from '@ember/service';

const tabStoreStub = Service.extend({
  tabs: []
});

moduleForComponent('ko-tab-strip', 'Integration | Component | ko tab strip', {
  integration: true,

  beforeEach() {
    getOwner(this).lookup('router:main').setupRouter();
    this.register('service:launchDarkly', Service.extend({}));
    this.register('service:tab-store', tabStoreStub);
    this.inject.service('tab-store', { as: 'tabStore' });

    let intlService = getOwner(this).lookup('service:intl');
    intlService.setLocale('en-us');
    intlService.addTranslations('en-us', {
      search: {
        new_tab_title: 'New Search'
      },
      cases: {
        new_case: 'New Case'
      },
      users: {
        new_user: 'New User'
      },
      organization: {
        new: 'New Organization'
      }
    });
  }
});

test('it renders a new search tab', function(assert) {
  assert.expect(4);

  this.set('tabStore.tabs', [{
    linkParams: ['session'],
    process: {
      type: 'search-new',
      model: {}
    }
  }]);

  this.render(hbs`
    {{#ko-tab-strip as |strip|}}
      {{strip.tabs}}
    {{/ko-tab-strip}}
  `);

  assert.equal(this.$('.qa-tab').length, 1, 'Render only one tab');
  assert.equal(this.$('.qa-search-new-tab').length, 1, 'Tab is a new search tab');
  assert.equal(this.$('.qa-search-new-tab .qa-tab-label').text().trim(), 'New Search', 'Label is set');
  assert.equal(this.$('.qa-search-new-tab .qa-tab-icon svg').length, 1, 'Icon svg is set');
});

test('it renders a search results tab', function(assert) {
  assert.expect(4);

  this.set('tabStore.tabs', [{
    linkParams: ['session'],
    process: {
      type: 'search-results',
      model: {
        id: 'Cheese'
      }
    }
  }]);

  this.render(hbs`
    {{#ko-tab-strip as |strip|}}
      {{strip.tabs}}
    {{/ko-tab-strip}}
  `);

  assert.equal(this.$('.qa-tab').length, 1, 'Render only one tab');
  assert.equal(this.$('.qa-search-results-tab').length, 1, 'Tab is a search results tab');
  assert.equal(this.$('.qa-search-results-tab .qa-tab-label').text().trim(), 'Cheese', 'Label is set');
  assert.equal(this.$('.qa-search-results-tab .qa-tab-icon svg').length, 1, 'Icon svg is set');
});

test('it renders a new case tab', function(assert) {
  assert.expect(4);

  this.set('tabStore.tabs', [{
    linkParams: ['session'],
    process: {
      type: 'case-new',
      model: {}
    }
  }]);

  this.render(hbs`
    {{#ko-tab-strip as |strip|}}
      {{strip.tabs}}
    {{/ko-tab-strip}}
  `);

  assert.equal(this.$('.qa-tab').length, 1, 'Render only one tab');
  assert.equal(this.$('.qa-case-new-tab').length, 1, 'Tab is a new case tab');
  assert.equal(this.$('.qa-case-new-tab .qa-tab-label').text().trim(), 'New Case', 'Label is set');
  assert.equal(this.$('.qa-case-new-tab .qa-tab-icon svg').length, 1, 'Icon svg is set');
});

test('it renders a case tab', function(assert) {
  assert.expect(5);

  this.set('tabStore.tabs', [{
    linkParams: ['session'],
    process: {
      type: 'case',
      model: {
        subject: 'CHEESE',
        requester: {
          avatar: 'http://foo.com/bacon.png'
        }
      }
    }
  }]);

  this.render(hbs`
    {{#ko-tab-strip as |strip|}}
      {{strip.tabs}}
    {{/ko-tab-strip}}
  `);

  assert.equal(this.$('.qa-tab').length, 1, 'Render only one tab');
  assert.equal(this.$('.qa-case-tab').length, 1, 'Tab is a case tab');
  assert.equal(this.$('.qa-case-tab .qa-tab-unread-count').length, 0, 'No unread count pill');
  assert.equal(this.$('.qa-case-tab .qa-tab-label').text().trim(), 'CHEESE', 'Label is set');
  assert.equal(this.$('.qa-case-tab .qa-tab-icon img').attr('src'), 'http://foo.com/bacon.png', 'Icon url is set');
});

test('it renders a new user tab', function(assert) {
  assert.expect(4);

  this.set('tabStore.tabs', [{
    linkParams: ['session'],
    process: {
      type: 'user-new',
      model: {}
    }
  }]);

  this.render(hbs`
    {{#ko-tab-strip as |strip|}}
      {{strip.tabs}}
    {{/ko-tab-strip}}
  `);

  assert.equal(this.$('.qa-tab').length, 1, 'Render only one tab');
  assert.equal(this.$('.qa-user-new-tab').length, 1, 'Tab is a new user tab');
  assert.equal(this.$('.qa-user-new-tab .qa-tab-label').text().trim(), 'New User', 'Label is set');
  assert.equal(this.$('.qa-user-new-tab .qa-tab-icon svg').length, 1, 'Icon svg is set');
});

test('it renders a user tab', function(assert) {
  assert.expect(4);

  this.set('tabStore.tabs', [{
    linkParams: ['session'],
    process: {
      type: 'user',
      model: {
        fullName: 'FRANK',
        avatar: 'http://foo.com/frank.png'
      }
    }
  }]);

  this.render(hbs`
    {{#ko-tab-strip as |strip|}}
      {{strip.tabs}}
    {{/ko-tab-strip}}
  `);

  assert.equal(this.$('.qa-tab').length, 1, 'Render only one tab');
  assert.equal(this.$('.qa-user-tab').length, 1, 'Tab is a user tab');
  assert.equal(this.$('.qa-user-tab .qa-tab-label').text().trim(), 'FRANK', 'Label is set');
  assert.equal(this.$('.qa-user-tab .qa-tab-icon img').attr('src'), 'http://foo.com/frank.png', 'Icon url is set');
});

test('it renders a new organization tab', function(assert) {
  assert.expect(4);

  this.set('tabStore.tabs', [{
    linkParams: ['session'],
    process: {
      type: 'organization-new',
      model: {}
    }
  }]);

  this.render(hbs`
    {{#ko-tab-strip as |strip|}}
      {{strip.tabs}}
    {{/ko-tab-strip}}
  `);

  assert.equal(this.$('.qa-tab').length, 1, 'Render only one tab');
  assert.equal(this.$('.qa-organization-new-tab').length, 1, 'Tab is a new org tab');
  assert.equal(this.$('.qa-organization-new-tab .qa-tab-label').text().trim(), 'New Organization', 'Label is set');
  assert.equal(this.$('.qa-organization-new-tab .qa-tab-icon svg').length, 1, 'Icon svg is set');
});

test('it renders a organization tab', function(assert) {
  assert.expect(4);

  this.set('tabStore.tabs', [{
    linkParams: ['session'],
    process: {
      type: 'organization',
      model: {
        name: 'EVIL CO'
      }
    }
  }]);

  this.render(hbs`
    {{#ko-tab-strip as |strip|}}
      {{strip.tabs}}
    {{/ko-tab-strip}}
  `);

  assert.equal(this.$('.qa-tab').length, 1, 'Render only one tab');
  assert.equal(this.$('.qa-org-tab').length, 1, 'Tab is an organization tab');
  assert.equal(this.$('.qa-org-tab .qa-tab-label').text().trim(), 'EVIL CO', 'Label is set');
  assert.equal(this.$('.qa-org-tab .qa-tab-icon img').length, 1, 'Icon svg is set');
});

test('a tab can be closed', function(assert) {
  assert.expect(1);

  this.set('tabStore.tabs', [{
    linkParams: ['session'],
    process: {
      type: 'case',
      model: {
        subject: 'CHEESE',
        requester: {
          avatar: 'http://foo.com/bacon.png'
        }
      }
    }
  }]);

  this.set('tabStore.close', () => {
    assert.ok(true, 'Close action is called');
  });

  this.render(hbs`
    {{#ko-tab-strip as |strip|}}
      {{strip.tabs}}
    {{/ko-tab-strip}}
  `);

  this.$('.qa-tab:eq(0) .qa-close-tab').click();
});
