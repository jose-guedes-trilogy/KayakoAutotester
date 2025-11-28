import DS from 'ember-data';

export default DS.Model.extend({
  lastIpAddress: DS.attr('string'),
  subscriptionInfo: DS.attr('string'),
  osVersion: DS.attr('string'),
  deviceManufacturer: DS.attr('string'),
  deviceModel: DS.attr('string'),
  screenSize: DS.attr('string')
});
