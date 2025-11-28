import DS from 'ember-data';

export default DS.Model.extend({
  from: DS.attr('string'),
  to: DS.attr('string'),
  subject: DS.attr('string'),
  text: DS.attr('string'),
  html: DS.attr('string'),
  isSuspended: DS.attr('boolean'),
  status: DS.attr('string'),
  reason: DS.attr('string'),
  size: DS.attr('number'),
  suspensionCode: DS.attr('string'),
  createdAt: DS.attr('date')
});
