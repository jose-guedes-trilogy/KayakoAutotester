import DS from 'ember-data';
import Postable from './postable';
import { computed } from '@ember/object';

export default Postable.extend({
  subject: DS.attr('string'),
  uuid: DS.attr('string'),
  firstMessage: DS.belongsTo('case-message', { async: false }),
  postType: 'side_conversation',
  messageCount: DS.attr('number'),
  status: DS.attr('string'),
  createdAt: DS.attr('date'),

  filteredSubject: computed('subject', function() {
    const subject = this.get('subject') || '';
    return subject.replace(/\[SC-\d+\]/g, '').trim();
  })
});
