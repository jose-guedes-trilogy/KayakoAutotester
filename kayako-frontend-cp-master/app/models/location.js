import DS from 'ember-data';

export default DS.Model.extend({
  city: DS.attr('string'),
  region: DS.attr('string'),
  regionCode: DS.attr('string'),
  areaCode: DS.attr('string'),
  timeZone: DS.attr('string'),
  organization: DS.attr('string'),
  netSpeed: DS.attr('string'),
  country: DS.attr('string'),
  countryCode: DS.attr('string'),
  postalCode: DS.attr('string'),
  latitude: DS.attr('string'),
  longitude: DS.attr('string'),
  metroCode: DS.attr('string'),
  isp: DS.attr('string')
});
