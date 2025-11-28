import DS from 'ember-data';

export default DS.Model.extend({
  brand: DS.belongsTo('brand', { async: false }),
  replyTimeExpectation: DS.attr('string', { defaultValue: '' }),

  /* enableSuggestions can have three states:
    1. true - enabled
    2. false - disabled
    3. null - disabled because article requirements have not been fulfilled.
  */
  enableSuggestions: DS.attr(), // passthrough (boolean or null)
  businesshour: DS.belongsTo('business-hour', { async: false }),
  homeTitles: DS.hasMany('locale_field', { async: false }),
  homeSubtitles: DS.hasMany('locale_field', { async: false }),
  metadata: DS.attr(), // passthrough
  resourceType: 'messenger-setting'
});
