import DS from 'ember-data';
import MF from 'ember-data-model-fragments';

export default DS.Model.extend({
  balance: DS.attr('always-string', { defaultValue: '' }),
  billTo: DS.belongsTo('contact', {async: false}),
  billing: MF.fragment('billing'),
  vatId: DS.attr('always-string', { defaultValue: '' })
});
