import DS from 'ember-data';

export default DS.Model.extend({
  access: DS.attr('string'),
  createdAt: DS.attr('date'),
  description: DS.attr('string'),
  logoUrl: DS.attr('string'),
  name: DS.attr('string'),
  signature: DS.attr('string'),
  tenantId: DS.attr('string'),
  updatedAt: DS.attr('date'),
  version: DS.attr('string'),

  platforms: DS.hasMany('app-platform'),
  slots: DS.hasMany('app-slot'),
});
