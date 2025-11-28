import DS from 'ember-data';

export default DS.Model.extend({
  value: DS.attr('string'),

  locale: DS.belongsTo('locale', { async: true })
});
