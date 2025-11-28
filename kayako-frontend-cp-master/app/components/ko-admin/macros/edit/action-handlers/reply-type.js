export default {
  serialize(action, macro, store) {
    this.reset(macro);

    if (action.value) {
      macro.set('replyType', action.value);
    }

    return macro;
  },

  deserialize(macro, actions) {
    let replyType = macro.get('replyType');

    if (replyType) {
      actions.push({
        name: 'reply-type',
        option: 'CHANGE',
        value: replyType
      });
    }

    return actions;
  },

  reset(macro) {
    macro.set('replyType', null);
  }
};
