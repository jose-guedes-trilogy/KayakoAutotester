import BaseComponent from '../base/component';
import fallbackIfUndefined from 'ember-basic-dropdown/utils/computed-fallback-if-undefined';
import { get } from '@ember/object';
import { set } from '@ember/object';

export default BaseComponent.extend({
  agents: fallbackIfUndefined([]),
  teams: fallbackIfUndefined([]),
  team: null,
  agent: null,
  assign: false,
  automationAction: null,
  onTeamChange: () => {},
  onAgentChange: () => {},

  init () {
    this._super(...arguments);
    let action = this.get('automationAction');
    let attributes = this.get('definition.attributes').reduce((obj, attr) => {
      if (!obj.hasOwnProperty(attr)) {
        obj[attr] = null;
      }
      if (attr === 'assign') {
        obj[attr] = (obj[attr] === 'true');
      }
      return obj;
    }, get(action, 'attributes') || {});
    set(action, 'attributes', attributes);
  },

  didReceiveAttrs() {
    this._super(...arguments);
    const action = this.get('automationAction');
    if(action) {
      const attributes = get(action, 'attributes');
      const teamId = get(attributes, 'assign_team_id');
      const agentId = get(attributes, 'assign_agent_id');
      if (teamId) {
        const currentTeam = this.get('teams').toArray().findBy('id', teamId);
        if(currentTeam) {
          this.set('team', currentTeam);
        }
      }
      if (agentId) {
        const currentAgent = this.get('agents').toArray().findBy('id', agentId);
        if(currentAgent) {
          this.set('agent', currentAgent);
        }
      }
    }
  },

  actions: {
    changeAction (team, agent) {
      this.set('team', team);
      this.set('agent', agent);
      if (this.get('automationAction')) {
        this.set('automationAction.attributes.assign_team_id', this.get('team.id'));
        this.set('automationAction.attributes.assign_agent_id', null);
        const teamId = get(team, 'id');
        this.set('automationAction.attributes.assign_team_id', teamId);
        this.get('onTeamChange')(this.get('teams').toArray().findBy('id', teamId));
        if (agent) {
          this.set('automationAction.attributes.assign_agent_id', this.get('agent.id'));
          const agentId = get(agent, 'id');
          this.set('automationAction.attributes.assign_agent_id', agentId);
          this.get('onAgentChange')(this.get('agents').toArray().findBy('id', agentId));
          return;
        }
        this.set('automationAction.attributes.assign_agent_id', null);
        this.get('onAgentChange')(null);
      }
    }
  }
});
