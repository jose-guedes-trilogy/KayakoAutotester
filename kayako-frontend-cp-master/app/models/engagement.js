import DS from 'ember-data';
import PostCreator from './post-creator';

export default PostCreator.extend({
  title: DS.attr('string'),
  executionOrder: DS.attr('number'),
  isEnabled: DS.attr('boolean'),
  createdAt: DS.attr('date'),
  updatedAt: DS.attr('date'),
  metric: DS.attr(),

  // Relations
  predicateCollections: DS.hasMany('predicate-collection', { defaultValue: [], async: false }),
  actions: DS.hasMany('automation-action', { defaultValue: [], async: false })
});
