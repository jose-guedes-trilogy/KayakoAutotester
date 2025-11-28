import DS from 'ember-data';

export default DS.Model.extend({
  cardType: DS.attr('string'),
  number: DS.attr('string'),
  address1: DS.attr('string'),
  address2: DS.attr('string'),
  city: DS.attr('string'),
  state: DS.attr('string'),
  postalCode: DS.attr('string'),
  expiryMonth: DS.attr('string'),
  expiryYear: DS.attr('string'),
  country: DS.attr('string'),
  isDefault: DS.attr('boolean'),
  name: DS.attr('string')
});
