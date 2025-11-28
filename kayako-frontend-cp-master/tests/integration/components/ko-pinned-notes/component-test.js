import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import startMirage from 'frontend-cp/tests/helpers/setup-mirage-for-integration';
import translations from 'frontend-cp/locales/en-us';
import EmberObject from '@ember/object';
import sanitizeInitializer from 'frontend-cp/initializers/setup-sanitizers';
import { task } from 'ember-concurrency';
import { getOwner } from '@ember/application';

let user, intlService;

const NOTES_TO_GENERATE = 10;

const generateUser = function () {
  const adminRole = server.create('role', { type: 'ADMIN' });
  const locale = server.create('locale', { locale: 'en-us' });

  user = EmberObject.create(server.create('user', { role: adminRole, locale }));
};

const fetchNotes = task(function * () {
  let notes = yield server.createList('note', NOTES_TO_GENERATE, {
    pinnedBy: user,
    isPinned: true,
    bodyText: 'This is a note',
    resourceUrl: 'http://support.kayako.com/api/v1/cases/1/notes/1'
  }).map(note => EmberObject.create(note));

  return user.set('viewNotes', notes);
}).restartable();

moduleForComponent('ko-pinned-notes', 'Integration | Component | ko pinned notes', {
  integration: true,

  setup() {
    intlService = getOwner(this).lookup('service:intl');
    intlService.setLocale('en-us');
    intlService.addTranslations('en-us', translations);
  },

  beforeEach() {
    startMirage(this.container);
    sanitizeInitializer.initialize(this.container.registry);
  },

  afterEach() {
    window.server.shutdown();
  }
});

test(`it renders ${NOTES_TO_GENERATE} notes correctly`, function(assert) {
  generateUser();
  this.set('user', user);
  this.set('fetchNotes', fetchNotes);

  this.render(hbs`{{ko-pinned-notes model=user fetchNotes=fetchNotes features=features}}`);

  assert.equal(this.$('.qa-pinned-notes--item').length, 10);
});
