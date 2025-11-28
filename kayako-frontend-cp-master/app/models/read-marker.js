import Model from 'ember-data/model';
import attr from 'ember-data/attr';

export default Model.extend({
  lastReadPostId: attr('string'),
  unreadCount: attr('number')
});
