import DS from 'ember-data';

export default DS.Model.extend({
  isPrimary: DS.attr('boolean', { defaultValue: false }),
  url: DS.attr('string'),

  parent: DS.belongsTo('has-websites', { async: true, polymorphic: true, parent: true })
});
