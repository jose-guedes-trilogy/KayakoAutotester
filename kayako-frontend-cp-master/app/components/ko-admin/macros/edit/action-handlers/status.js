export default {
  serialize(action, macro, store) {
    this.reset(macro);

    if (action.value) {
      let caseStatus = store.peekRecord('case-status', action.value);
      macro.set('status', caseStatus);
    }

    return macro;
  },

  deserialize(macro, actions) {
    let status = macro.get('status');

    if (status) {
      actions.push({
        name: 'status',
        option: 'CHANGE',
        value: status.get('id').toString()
      });
    }

    return actions;
  },

  reset(macro) {
    macro.set('status', null);
  }
};
