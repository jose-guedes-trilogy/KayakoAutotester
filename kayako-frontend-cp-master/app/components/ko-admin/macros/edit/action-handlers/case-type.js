export default {
  serialize(action, macro, store) {
    this.reset(macro);

    if (action.value) {
      let caseType = store.peekRecord('case-type', action.value);
      macro.set('caseType', caseType);
    }

    return macro;
  },

  deserialize(macro, actions) {
    let caseType = macro.get('caseType');

    if (caseType) {
      actions.push({
        name: 'case-type',
        option: 'CHANGE',
        value: caseType.get('id').toString()
      });
    }

    return actions;
  },

  reset(macro) {
    macro.set('caseType', null);
  }
};
