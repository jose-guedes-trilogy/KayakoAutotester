import DS from 'ember-data';
import MF from 'ember-data-model-fragments';

export default MF.Fragment.extend({
  hosted_page_id: DS.attr('string'),
  hosted_page_url: DS.attr('string'),
  payment_gateway: DS.attr('string'),
  currency: DS.attr('string')
});
