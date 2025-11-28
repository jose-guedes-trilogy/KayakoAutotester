import Component from '@ember/component';
import { computed } from '@ember/object';
import { empty } from '@ember/object/computed';

export default Component.extend({
  tagName: '',
  recipient: null,
  allRoles: [],
  allTeams: [],

  roleSorting: ['title:asc'],
  sortedRoles: computed.sort('allRoles', 'roleSorting'),

  teamSorting: ['title:asc'],
  sortedTeams: computed.sort('availableTeams', 'teamSorting'),

  availableTeams: computed('allTeams.@each.id', 'selectedTeams.@each.id', function () {
    const editedTeamIds = this.get('selectedTeams').mapBy('id');
    return this.get('allTeams').filter(team => editedTeamIds.indexOf(team.get('id')) === -1);
  }),

  selectedTeams: computed('recipient.teams.[]', function () {
    return this.get('recipient.teams').toArray();
  }),

  disableTeamSelector: empty('allTeams'),

  didReceiveAttrs() {
    this._super(...arguments);

    if (this.get('onBoarding')) {
      this.configureForOnBoarding();
    }
  },

  configureForOnBoarding() {
    let agentRole = this.get('allRoles').findBy('title', 'Agent');
    let generalTeam = this.get('allTeams').findBy('title', 'General');

    if (agentRole) {
      this.set('recipient.role', agentRole);
    }

    if (generalTeam) {
      this.get('recipient.teams').addObject(generalTeam);
    }
  }
});
