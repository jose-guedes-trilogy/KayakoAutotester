export default {
  serialize(action, macro, store) {
    this.reset(macro);

    if (action.option) {
      if (action.option === 'CHANGE') {
        if (action.value) {
          let priority = store.peekRecord('case-priority', action.value);
          macro.set('priority', priority);
          macro.set('priorityAction', null);
        }
      } else {
        macro.set('priority', null);
        macro.set('priorityAction', `${action.option}_ONE_LEVEL`);
      }
    }

    return macro;
  },

  deserialize(macro, actions) {
    let { priority, priorityAction } = macro.getProperties('priority', 'priorityAction');

    if (priority) {
      actions.push({
        name: 'priority',
        option: 'CHANGE',
        value: priority.get('id').toString()
      });
    } else if (priorityAction) {
      actions.push({
        name: 'priority',
        option: priorityAction.match(/(.*)_ONE_LEVEL/)[1],
        value: null
      });
    }

    return actions;
  },

  reset(macro) {
    macro.set('priority', null);
    macro.set('priorityAction', null);
  }
};
