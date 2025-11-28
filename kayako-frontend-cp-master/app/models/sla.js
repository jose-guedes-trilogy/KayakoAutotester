import DS from 'ember-data';

export default DS.Model.extend({
  title: DS.attr('always-string', { defaultValue: '' }),
  description: DS.attr('always-string', { defaultValue: '' }),
  executionOrder: DS.attr('number'),
  predicateCollections: DS.hasMany('predicate-collection', { async: false }),
  targets: DS.hasMany('sla-target', { async: false }),
  isEnabled: DS.attr('boolean', { defaultValue: true }),
  isDeleted: DS.attr('boolean'),
  createdAt: DS.attr('date'),
  updatedAt: DS.attr('date')
});
