import DS from 'ember-data';

export default DS.Model.extend({
  title: DS.attr('string'),
  icon: DS.hasMany('attachment', { async: false }),
  createdAt: DS.attr('date')
});
