export default {
  serialize(action, macro, store) {
    this.reset(macro);

    if (action && action.value) {
      let value = action.value;

      if (value === 'UNASSIGNED' || value === 'CURRENT_AGENT') {
        macro.set('assigneeType', value);
      } else {
        let [teamId, agentId] = value.split('-');
        let team = store.peekRecord('team', teamId);

        if (agentId) {
          let agent = store.peekRecord('user', agentId);
          macro.setProperties({
            assignedAgent: agent,
            assignedTeam: team,
            assigneeType: 'AGENT'
          });
        } else {
          macro.setProperties({
            assignedTeam: team,
            assigneeType: 'TEAM'
          });
        }
      }
    }

    return macro;
  },

  deserialize(macro, actions) {
    let {
      assigneeType,
      assignedAgent,
      assignedTeam
    } = macro.getProperties('assigneeType', 'assignedAgent', 'assignedTeam');

    if (assigneeType) {
      if (['UNASSIGNED', 'CURRENT_AGENT'].indexOf(assigneeType) > -1) {
        actions.push({
          name: 'assignee',
          option: 'CHANGE',
          value: assigneeType
        });
      } else if (assigneeType === 'AGENT') {
        actions.push({
          name: 'assignee',
          option: 'CHANGE',
          value: `${assignedTeam.get('id').toString()}-${assignedAgent.get('id').toString()}`
        });
      } else {
        actions.push({
          name: 'assignee',
          option: 'CHANGE',
          value: assignedTeam.get('id').toString()
        });
      }
    }

    return actions;
  },

  reset(macro) {
    macro.set('assigneeType', null);
    macro.set('assignedAgent', null);
    macro.set('assignedTeam', null);
  }
};
