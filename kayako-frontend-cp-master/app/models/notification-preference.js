import Model from 'ember-data/model';
import attr from 'ember-data/attr';

export default Model.extend({
  notificationType: attr('String'),
  channelDesktop: attr('boolean'),
  channelMobile: attr('boolean'),
  channelEmail: attr('boolean')
});
