import DS from 'ember-data';

let { Model, attr } = DS;

export default Model.extend({
  label: attr('string', { defaultValue: '' }),
  description: attr('string', { defaultValue: '' }),
  channel: attr('string'),
  token: attr('string'),
  isEnabled: attr('boolean', { defaultValue: true }),
  lastUsedAt: attr('date'),
  createdAt: attr('date'),
  updatedAt: attr('date')
});
