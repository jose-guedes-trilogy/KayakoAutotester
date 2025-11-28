import { computed } from '@ember/object';
import moment from 'moment';
import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import { belongsTo } from 'ember-data/relationships';

export default Model.extend({
  activity: belongsTo('activity'),
  readState: attr('string'),
  createdAt: attr('string'),
  notificationType: attr('string'),
  notificationDay: computed('createdAt', function () {
    const createdAt = moment(this.get('createdAt'));
    const daysDiff = moment().diff(createdAt, 'days');

    if (daysDiff === 0) {
      return 'Today';
    }

    if (daysDiff === 1) {
      return 'Yesterday';
    }

    return createdAt.format('DD/MM/YYYY');
  })
});
