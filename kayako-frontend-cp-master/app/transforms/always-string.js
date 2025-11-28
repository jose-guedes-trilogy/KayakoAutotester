import DS from 'ember-data';

export default DS.Transform.extend({
  deserialize(serialized) {
    if (serialized === null || serialized === undefined) { //eslint-disable-line no-undefined
      return '';
    } else {
      return String(serialized);
    }
  },

  serialize(deserialized) {
    return deserialized;
  }
});
