import DS from 'ember-data';

export default DS.Model.extend({
  mediaUrl: DS.attr('string'),
  mediaUrlHttps: DS.attr('string'),
  url: DS.attr('string'),
  displayUrl: DS.attr('string'),
  expandedUrl: DS.attr('string'),

  // Virtual parent field
  message: DS.belongsTo('twitter-tweet', { async: true, parent: true})
});
