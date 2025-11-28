import DS from 'ember-data';

export default DS.Model.extend({
  label: DS.attr('string'),
  object: DS.belongsTo('object', {polymorphic: true, async: false})
});
