import DS from 'ember-data';
import PostCreator from './post-creator';

export default PostCreator.extend({
  title: DS.attr('string', { defaultValue: '' }),
  description: DS.attr('string', { defaultValue: '' }),
  createdAt: DS.attr('date')
});
