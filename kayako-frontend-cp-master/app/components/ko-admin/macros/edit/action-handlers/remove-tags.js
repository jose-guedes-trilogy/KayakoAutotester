export default {
  serialize(action, macro, store) {
    this.reset(macro);

    if (action.value) {
      let tags = (action.value && action.value.split(',')) || null;
      let removeTags = macro.get('removeTags');

      if (removeTags) {
        macro.get('removeTags').setObjects(tags);
      } else {
        macro.set('removeTags', tags);
      }
    }

    return macro;
  },

  deserialize(macro, actions) {
    let removeTags = macro.get('removeTags');

    if (removeTags && removeTags.length) {
      actions.push({
        name: 'remove-tags',
        option: 'REMOVE',
        value: removeTags.join(',')
      });
    }

    return actions;
  },

  reset(macro) {
    macro.set('removeTags', []);
  }
};
