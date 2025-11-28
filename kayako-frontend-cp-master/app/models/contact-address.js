import DS from 'ember-data';

export default DS.Model.extend({
  isPrimary: DS.attr('boolean', { defaultValue: false }),
  address1: DS.attr('string'),
  address2: DS.attr('string'),
  city: DS.attr('string'),
  state: DS.attr('string'),
  postalCode: DS.attr('string'), // TODO maybe integer?
  country: DS.attr('string'), // TODO should be country code
  type: DS.attr('string', { defaultValue: 'OTHER' }),

  parent: DS.belongsTo('has-addresses', { async: true, polymorphic: true, parent: true })
});
