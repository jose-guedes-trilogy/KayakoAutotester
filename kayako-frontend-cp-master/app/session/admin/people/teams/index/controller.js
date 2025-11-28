import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import { on } from '@ember/object/evented';
import { task } from 'ember-concurrency';

export default Controller.extend({
  storeCache: service(),
  confirmation: service(),

  // prime agents cache - makes loading team pages faster
  primeAgentCache: on('init', function() {
    this.get('storeCache').query('user', {role: 'collaborator'});
  }),

  filter: '',
  filteredResults: computed('model.@each.{title,isDeleted}', 'filter', function() {
    let teams = this.get('model');
    let filter = this.get('filter');
    let regEx = new RegExp(filter, 'i');

    teams = teams.filter(team => !team.get('isDeleted'));

    if (filter) {
      teams = teams.filter(team => regEx.test(team.get('title')));
    }

    return teams;
  }),

  // Tasks

  deleteTeam: task(function * (team) {
    let confirmation = this.get('confirmation');
    let confirmed = yield confirmation.confirm({
      intlConfirmationHeader: 'admin.teams.confirm_delete.title',
      intlConfirmationBody: 'admin.teams.confirm_delete.body'
    });

    if (confirmed) {
      return yield team.destroyRecord();
    }
  }).drop(),

  // Actions

  actions: {
    transitionToAddNewTeam() {
      this.transitionToRoute('session.admin.people.teams.new');
    },

    editTeam(team) {
      this.transitionToRoute('session.admin.people.teams.edit', team.get('id'));
    }
  }
});
