import DS from 'ember-data';

export default DS.Model.extend({
  realtimeAppKey: DS.attr('string'),
  webpushPublicKey: DS.attr('string')
});
