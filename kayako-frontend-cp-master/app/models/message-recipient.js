import DS from 'ember-data';
import { computed } from '@ember/object';
import moment from 'moment';

export default DS.Model.extend({
  name: DS.attr('string'),
  messageRecipientType: DS.attr('string'),
  emailDeliveryStatus: DS.attr('string'),
  emailDeliveryStatusUpdatedAt: DS.attr('date'),
  identity: DS.belongsTo('identity-email', { async: false }),

  isCC: computed.equal('messageRecipientType', 'CC'),
  isTo: computed.equal('messageRecipientType', 'TO'),
  time: computed('emailDeliveryStatusUpdatedAt', function() {
    return moment(this.get('emailDeliveryStatusUpdatedAt')).fromNow();
  })
});
