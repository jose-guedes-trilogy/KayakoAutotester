import DS from 'ember-data';

export default DS.Model.extend({
  locale: DS.attr('string'),
  translation: DS.attr('string', { defaultValue: '' }),
  createdAt: DS.attr('date'),
  updatedAt: DS.attr('date')
});
