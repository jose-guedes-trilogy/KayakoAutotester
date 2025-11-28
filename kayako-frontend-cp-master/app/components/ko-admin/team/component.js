import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import { task, timeout, all } from 'ember-concurrency';
import { get } from '@ember/object';

const DEBOUNCE_MS = 250;
const MIN_TERM_LENGTH = 3;

export default Component.extend({
  tagName: '',

  // Attributes
  title: null,
  businessHours: null,
  team: null,
  editedTeam: null,
  schema: null,
  onCancel: () => {},
  onDelete: () => {},
  onSuccess: () => {},

  // State
  noMatchesMessage: null,

  // Services
  confirmation: service(),
  i18n: service(),
  session: service(),
  store: service(),
  errorHandler: service(),
  virtualModel: service(),
  router: service('-routing'),

  // Computed Properties
  members: computed('editedTeam.members.@each.fullName', function() {
    return this.get('editedTeam.members').sortBy('fullName');
  }),

  // Tasks
  findAgents: task(function * (term) {
    let i18n = this.get('i18n');

    this.set('noMatchesMessage', i18n.t('users.team_member_search.no_results'));

    if (!term || term.length < MIN_TERM_LENGTH) {
      this.set('noMatchesMessage', i18n.t('users.team_member_search.too_short', { count: MIN_TERM_LENGTH }));
      return [];
    }

    yield timeout(DEBOUNCE_MS);

    let store = this.get('store');
    let query = `"${term}" in:users (role:agent OR role:collaborator)`;
    let fields = 'resource,resource_url,data(is_enabled,avatar,full_name,last_active_at,role(title))';
    let include = 'user,role';
    let limit = 10;
    let results = yield store.query('search-result', { query, fields, include, limit });
    let agents = yield all(results.mapBy('resultData'));

    agents = agents.filterBy('isEnabled');

    return agents;
  }).restartable(),

  addMember: task(function * (user) {
    this.get('editedTeam.members').addObject(user);
  }),

  removeMember: task(function * (user) {
    this.get('editedTeam.members').removeObject(user);
  }),

  viewMember: task(function * (user) {
    let router = this.get('router');
    let id = get(user, 'id');

    router.transitionTo('session.agent.users.user', [id]);
  }),

  save: task(function * () {
    let team = this.get('team');
    let editedTeam = this.get('editedTeam');
    let virtualModel = this.get('virtualModel');
    let schema = this.get('schema');
    let store = this.get('store');
    let teamAdapter = store.adapterFor('team');
    let oldMembers = team.get('members');
    let newMembers = editedTeam.get('members');
    let membersToAdd = newMembers.filter(user => !oldMembers.includes(user));
    let membersToRemove = oldMembers.filter(user => !newMembers.includes(user));

    try {
      yield virtualModel.save(team, editedTeam, schema);

      if (membersToAdd.length) {
        yield teamAdapter.addMembers(team, membersToAdd);
      }

      if (membersToRemove.length) {
        yield teamAdapter.removeMembers(team, membersToRemove);
      }

      // The API currently doesn’t update member_count when using
      // /api/v1/teams/{id}/members so we have to give it a nudge
      yield team.save();

      this.get('onSuccess')();
    } catch ({ responseJSON: errors }) {
      this.get('errorHandler').process({ errors });
    }
  }).drop(),

  delete: task(function * () {
    let confirmed = yield this.get('confirmation').confirm({
      intlConfirmLabel: 'generic.confirm.delete_button',
      intlConfirmationBody: 'admin.teams.labels.delete_team_confirmation',
      intlConfirmationHeader: 'admin.teams.labels.confirm_delete'
    });

    if (!confirmed) {
      return;
    }

    yield this.get('team').destroyRecord();

    this.get('onDelete')();
  }).drop(),

  cancel: task(function * () {
    this.get('onCancel')();
  })
});
