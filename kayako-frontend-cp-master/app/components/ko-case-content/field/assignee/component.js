import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import KeyboardShortcuts from 'ember-keyboard-shortcuts/mixins/component';
import { task, didCancel } from 'ember-concurrency';
import { get } from '@ember/object';

export default Component.extend(KeyboardShortcuts, {
  // Attributes
  agent: null,
  admin: null,
  field: null,
  isErrored: false,
  isEdited: false,
  isKREEdited: false,
  isDisabled: false,
  onValueChange: null,
  hasEmptyOption: false,
  emptyLabel: null,
  agents: null,
  teams: null,

  keyboardShortcuts: {
    'ctrl+alt+a': {
      action: 'open',
      global: false,
      preventDefault: true
    },
    a: {
      action: 'open',
      global: false
    }
  },

  // State
  assigneeValues: [],

  // HTML
  tagName: '',

  // Services
  store: service(),
  i18n: service(),

  // Lifecycle hooks
  init() {
    this._super(...arguments);
    if (this.get('emptyLabel') === null) {
      this.set('emptyLabel', this.get('i18n').t('cases.unassigned'));
    }
    this.setAssigneeValues();
  },

  // CPs
  currentlySelectedValue: computed('agent.id', 'team.id', function() {
    if (this.get('team') === '0') {
      return '0';
    }
    else {
      return generateTeamAgentId(this.get('team.id'), this.get('agent.id'));
    }
  }),

  // Tasks
  getAgents: task(function * () {
    const store = this.get('store');
    let allAgents = [];
    let offset = 0;
    const limit = 500;

    while (true) {
      const response = yield store.query('user', {
        role: 'agent',
        limit,
        offset,
        include: ['role', 'identity-facebook', 'identity-twitter', 'identity-phone', 'identity_email']
      });

      allAgents = allAgents.concat(response.toArray());

      if (!response.meta || !response.meta.total || offset + limit >= response.meta.total) {
        break;
      }

      offset += limit;
    }

    return allAgents;
  }).restartable(),

  // Actions
  actions: {
    assigneeSelected(item) {
      let agent = null;
      let team = null;
      const id = get(item || {}, 'id');

      if (id && id === '0') {
        team = '0';
        agent = null;
      }
      else if (id) {
        const [teamId, agentId] = id.split('-');
        team = this.get('teams').findBy('id', teamId);

        if (agentId) {
          agent = this.get('agents').findBy('id', agentId);
        }
      }

      this.attrs.onValueChange(team, agent);
    },

    open() {
      this.get('drillDownComponent').send('open');
    }
  },

  // Methods
  generateTeamAgentId(teamId, agentId) {
    return agentId ? teamId + '-' + agentId : teamId;
  },

  setAssigneeValues() {
    this.get('getAgents').perform()
      .then((agents) => {
        let teams = this.get('teams');
        this.set('agents', agents);
        let assigneeValues = [
          {
            value: this.get('i18n').t('cases.unassigned'),
            id: '0',
            object: null,
            children: []
          },
          ...generateAssigneeValues({ agents, teams })
        ];
        this.set('assigneeValues', assigneeValues);
      }).catch(e => {
        if (!didCancel(e)) {
          throw e;
        }
      });
  }
});
export function generateAssigneeValues({ agents, teams }) {
  agents = agents.filter(agent => agent.get('isEnabled'));
  let result = teams.map(team => {
    return ({
      value: team.get('title'),
      id: team.get('id'),
      object: {team},
      children: []
    });
  });
  agents.forEach(agent => {
    agent.get('teams').forEach(team => {
      let agentsInTeam = result.find(i => i.value === team.get('title')).children;
      agentsInTeam.pushObject({
        id: generateTeamAgentId(team.id, agent.id),
        object: {team, agent},
        value: agent.get('fullName')
      });
    });
  });
  return result;
}

function generateTeamAgentId(teamId, agentId) {
  return agentId ? teamId + '-' + agentId : teamId;
}
