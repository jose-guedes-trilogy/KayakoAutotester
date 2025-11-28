import DS from 'ember-data';

export default DS.Model.extend({
  lastActiveAgents: DS.hasMany('user-minimal'),
  averageReplyTime: DS.attr('string')
});
