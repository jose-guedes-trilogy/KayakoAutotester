import Component from '@ember/component';
import { computed } from '@ember/object';
import moment from 'moment';
import { get } from '@ember/object';

export default Component.extend({
  tagName: '',

  // Attributes
  updateLog: null,

  // CP's
  summary: computed('updateLog.[]', function() {
    return this.get('updateLog').reduce((previousValue, currentValue) => {
      let fullName = get(currentValue, 'user.fullName');

      if (!(previousValue.mapBy('fullName').includes(fullName))) {
        previousValue.push({
          fullName,
          activityCount: 1,
          lastUpdatedAt: currentValue.updatedAt
        });
      } else {
        let existingEntry = previousValue.find((entry) => {
          return entry.fullName === fullName;
        });
        existingEntry.activityCount += 1;
        if (moment(currentValue.updatedAt).isAfter(existingEntry.lastUpdatedAt, 'minute')) {
          existingEntry.lastUpdatedAt = currentValue.updatedAt;
        }
      }
      return previousValue;
    }, []);
  })
});

