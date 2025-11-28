import DS from 'ember-data';
import PostCreator from './post-creator';

export default PostCreator.extend({
  title: DS.attr('string', { defaultValue: '' }),
  executionOrder: DS.attr('number'),
  isEnabled: DS.attr('boolean'),
  lastExecutedAt: DS.attr('date'),
  createdAt: DS.attr('date'),
  updatedAt: DS.attr('date'),

  // Relations
  predicateCollections: DS.hasMany('predicate-collection', { defaultValue: [], async: false }),
  actions: DS.hasMany('automation-action', { defaultValue: [], async: false })
});
