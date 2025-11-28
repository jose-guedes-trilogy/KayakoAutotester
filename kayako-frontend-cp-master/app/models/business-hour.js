import DS from 'ember-data';

export default DS.Model.extend({
  title: DS.attr('string', { defaultValue: '' }),
  zones: DS.attr({defaultValue: () => []}),
  holidays: DS.hasMany('businesshour-holiday', { async: false }),
  isDefault: DS.attr('boolean'),
  createdAt: DS.attr('date'),
  updatedAt: DS.attr('date')
});
