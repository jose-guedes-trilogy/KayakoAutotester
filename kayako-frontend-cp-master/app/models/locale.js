import DS from 'ember-data';

export default DS.Model.extend({
  locale: DS.attr('string'),
  name: DS.attr('string'),
  nativeName: DS.attr('string'),
  region: DS.attr('string'),
  nativeRegion: DS.attr('string'),
  script: DS.attr('string'),
  variant: DS.attr('string'),
  direction: DS.attr('string'),
  isPublic: DS.attr('boolean'),
  isLocalized: DS.attr('boolean'),
  createdAt: DS.attr('date'),
  updatedAt: DS.attr('date'),

  strings: DS.hasMany('locale-string', { async: true })
});
