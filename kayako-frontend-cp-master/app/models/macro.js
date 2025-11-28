import DS from 'ember-data';
import MF from 'ember-data-model-fragments';

export default DS.Model.extend({
  title: DS.attr('string'),
  usageCount: DS.attr('number'),
  lastUsedAt: DS.attr('date'),
  visibilityType: DS.attr('string', { defaultValue: 'PRIVATE' }),
  replyType: DS.attr('string'),
  replyContents: DS.attr('string'),
  assigneeType: DS.attr('string'),
  priorityAction: DS.attr('string'),
  addTags: DS.attr({defaultValue: () => []}),
  removeTags: DS.attr({defaultValue: () => []}),

  // Relationships
  visibleToTeam: DS.belongsTo('team', { async: true }),
  assignedTeam: DS.belongsTo('team', { async: false }),
  assignedAgent: DS.belongsTo('user', { async: false }),
  priority: DS.belongsTo('case-priority', { async: false }),
  status: DS.belongsTo('case-status', { async: false }),
  agent: DS.belongsTo('user', { async: false }),
  caseType: DS.belongsTo('case-type', { async: false }),
  tags: DS.hasMany('macro-tag', { async: false }),

  // read only
  visibility: MF.fragment('macro-visibility'),

  actions: MF.fragmentArray('macro-action', { defaultValue: [], async: false })
});
