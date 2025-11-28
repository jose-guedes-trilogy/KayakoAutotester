import DS from 'ember-data';

export default DS.Model.extend({
  color: DS.attr('string'),
  event: DS.attr('string'),
  iconUrl: DS.attr('string'),
  url: DS.attr('string'),
  properties: DS.attr()
});
