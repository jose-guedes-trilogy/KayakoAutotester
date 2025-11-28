import DS from 'ember-data';
import MF from 'ember-data-model-fragments';

export default MF.Fragment.extend({
  slas: DS.attr('number'),
  business_hours: DS.attr('number'),
  custom_security_policy: DS.attr('boolean'),
  brands: DS.attr('number'),
  agents: DS.attr('string'),
  collaborators: DS.attr('string'),
  attachment_size_limit: DS.attr('number'),
  teams: DS.attr('number'),
  custom_headers: DS.attr('number')
});
