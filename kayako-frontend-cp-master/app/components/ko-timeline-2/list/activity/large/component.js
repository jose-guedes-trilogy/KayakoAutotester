import Component from '@ember/component';
import { inject as service } from '@ember/service';
import moment from 'moment';
import { computed } from '@ember/object';
import activityFacade from 'frontend-cp/lib/facade/activity';

export default Component.extend({
  tagName: '',

  // Attributes
  activity: null,
  type: null,

  // Services
  i18n: service(),
  serverClock: service(),

  // Lifecycle Hooks
  init() {
    this._super(...arguments);
    this.set('activityFacade', new activityFacade({ activity: this.get('activity')}));
  },

  // CP's
  activityRatingComment: computed('activity.rating.comment', function() {
    let i18n = this.get('i18n');
    let comment = this.get('activityFacade.rating.comment');

    return `${comment} ${i18n.t('generic.close_quotes')}`;
  }),

  hasCompletedWithinTheLast10Minutes: computed('activityFacade.isCompleted', 'activity.createdAt', 'serverClock.date', function() {
    return this.get('activityFacade.isCompleted') && moment(this.get('activity.createdAt')).add(10, 'minutes') > this.get('serverClock.date');
  }),

  // Functions
  localizedMetricName: function (metricName) {
    const i18n = this.get('i18n');
    switch (metricName) {
      case 'FIRST_REPLY_TIME':
        return i18n.t('timeline.activity.firstReplyTimeBreach');
      case 'NEXT_REPLY_TIME':
        return i18n.t('timeline.activity.nextReplyTimeBreach');
      case 'RESOLUTION_TIME':
        return i18n.t('timeline.activity.resolutionTimeBreach');
    }
  }
});
