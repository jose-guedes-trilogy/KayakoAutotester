export default {
  serialize(action, macro, store) {
    this.reset(macro);

    if (action.value) {
      macro.set('replyContents', action.value);
    }

    return macro;
  },

  deserialize(macro, actions) {
    let replyContents = macro.get('replyContents');

    if (replyContents) {
      actions.push({
        name: 'reply-contents',
        option: 'CHANGE',
        value: replyContents
      });
    }

    return actions;
  },

  reset(macro) {
    macro.set('replyContents', null);
  }
};
