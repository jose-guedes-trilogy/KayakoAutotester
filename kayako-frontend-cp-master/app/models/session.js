import DS from 'ember-data';

export default DS.Model.extend({
  portal: DS.attr('string'),
  ipAddress: DS.attr('string'),
  userAgent: DS.attr('string'),
  user: DS.belongsTo('user', { async: false }),
  status: DS.attr('string'),
  createdAt: DS.attr('date'),
  lastActivityAt: DS.attr('date'),
  csrfToken: DS.attr('string'),
  rememberMeToken: DS.attr('string'),
  instanceId: DS.attr('string'),
  instanceName: DS.attr('string')
});
