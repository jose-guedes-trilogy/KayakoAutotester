import DS from 'ember-data';
import PostCreator from './post-creator';

export default PostCreator.extend({
  title: DS.attr('string'),
  channel: DS.attr('string', { defaultValue: null }),
  event: DS.attr('string', { defaultValue: null }),
  executionOrder: DS.attr('number'),
  isEnabled: DS.attr('boolean'),
  lastTriggeredAt: DS.attr('date'),
  createdAt: DS.attr('date'),
  updatedAt: DS.attr('date'),

  // Relations
  predicateCollections: DS.hasMany('predicate-collection', { defaultValue: [], async: false }),
  actions: DS.hasMany('automation-action', { defaultValue: [], async: false })
});
