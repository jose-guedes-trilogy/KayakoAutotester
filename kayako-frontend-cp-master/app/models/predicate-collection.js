import DS from 'ember-data';

export default DS.Model.extend({
  propositions: DS.hasMany('proposition', { async: false })
});
