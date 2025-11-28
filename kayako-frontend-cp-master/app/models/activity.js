import DS from 'ember-data';
import MF from 'ember-data-model-fragments';

export default DS.Model.extend({
  activity: DS.attr('string'),
  actor: MF.fragment('activity-object'),
  verb: DS.attr('string'),
  summary: DS.attr('string'),
  actions: DS.hasMany('action'),
  object: MF.fragment('activity-object'),
  apiEvent: DS.belongsTo('event'),
  helpcenterComment: DS.belongsTo('comment'),
  actorUser: DS.belongsTo('user'),
  objectActorUser: DS.belongsTo('user'),
  caseMessage: DS.belongsTo('case-message'),
  rating: DS.belongsTo('rating'),
  objectActor: MF.fragment('activity-object'),
  location: MF.fragment('activity-location'),
  place: MF.fragment('activity-object'),
  target: MF.fragment('activity-object'),
  result: MF.fragment('activity-object'),
  note: DS.belongsTo('note'),
  inReplyTo: MF.fragment('activity-object'),
  participant: MF.fragment('activity-object'),
  portal: DS.attr('string'),
  weight: DS.attr('number'),
  ipAddress: DS.attr('string'),
  createdAt: DS.attr('date'),
  case: DS.belongsTo('case', { async: true }),
  isActivity: true
});
