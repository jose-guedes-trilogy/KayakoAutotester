import DS from 'ember-data';

export default DS.Model.extend({
  posts: DS.hasMany('post', { async: true, polymorphic: true })
});
