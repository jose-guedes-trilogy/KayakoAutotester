export default {
  serialize(action, macro, store) {
    this.reset(macro);

    if (action.value) {
      let tags = action.value.split(',');
      let addTags = macro.get('addTags');

      if (addTags) {
        macro.get('addTags').setObjects(tags);
      } else {
        macro.set('addTags', tags);
      }
    }

    return macro;
  },

  deserialize(macro, actions) {
    let addTags = macro.get('addTags');

    if (addTags && addTags.length) {
      actions.push({
        name: 'add-tags',
        option: 'ADD',
        value: addTags.join(',')
      });
    }

    return actions;
  },

  reset(macro) {
    macro.set('addTags', []);
  }
};
