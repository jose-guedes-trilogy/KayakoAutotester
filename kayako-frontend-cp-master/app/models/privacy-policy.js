import DS from 'ember-data';

export default DS.Model.extend({
  locale: DS.attr('string'),
  url: DS.attr('string'),
  privacyType: DS.attr('string'),
  default: DS.attr('boolean'),
});
