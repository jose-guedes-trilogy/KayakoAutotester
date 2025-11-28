import DS from 'ember-data';

export default DS.Model.extend({
  name: DS.attr('string'),
  events: DS.attr('array')
});
