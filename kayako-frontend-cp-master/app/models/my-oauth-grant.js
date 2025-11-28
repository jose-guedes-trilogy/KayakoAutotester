import DS from 'ember-data';
import MF from 'ember-data-model-fragments';

export default DS.Model.extend({
  client: MF.fragment('my-oauth-client', { async: false }),
  lastActivityAt: DS.attr('date')
});
