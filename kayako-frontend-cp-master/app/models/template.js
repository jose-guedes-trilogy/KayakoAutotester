import DS from 'ember-data';

export default DS.Model.extend({
  name: DS.attr('string'),
  app: DS.attr('string'),
  category: DS.attr('string'),
  contents: DS.attr('string'),
  isCustom: DS.attr('boolean')
});
