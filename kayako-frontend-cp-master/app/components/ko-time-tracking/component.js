import Component from '@ember/component';
import Ember from 'ember';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import { task, timeout } from 'ember-concurrency';
import diffAttrs from 'ember-diff-attrs';
import moment from 'moment';
import _ from 'npm:lodash';

import { variation } from 'ember-launch-darkly';

export default Component.extend({
  store: service(),
  notification: service(),
  session: service(),
  i18n: service(),
  metrics: service(),
  plan: service(),

  case: null,
  tracked: null,
  activities: null,
  timerHours: null,
  timerMinutes: null,
  timerSeconds: null,
  timerTotalSeconds: 0,
  editingEntry: null,
  editingEntryTime: null,
  timeWorked: null,
  timeBilled: null,
  isBillable: false,
  isTimerRunning: false,
  isEditing: false,
  isEnabled: false,

  init() {
    this._super(...arguments);
    this.get('checkIfEnabled').perform();
  },

  timerValueState: null,
  isBillableState: null,
  preserveTimer: () => {},

  didReceiveAttrs: diffAttrs('case', function(changedAttrs, ...args) {
    this._super(...args);

    if (!changedAttrs || changedAttrs.case) {
      this.get('startTracking').cancelAll();
      this.get('updateLog').cancelAll();
      this.send('stopTimer');
      this.setProperties({
        'timeWorked': null,
        'timeBilled': null
      });

      // If timer value is found in the case state, resume timer
      if (this.get('timerValueState')) {
        this.set('timerTotalSeconds', this.get('timerValueState'));
        this.send('playPauseTimer');
      }
      if (this.get('isBillableState')) {
        this.send('updateIsBillable', this.get('isBillableState'));
      }
      
      this.get('fetchTracked').perform();
      this.get('fetchActivities').perform();
    }
  }),

  checkIfEnabled: task(function * () {
    const settings = yield this.get('store').findAll('setting', { reload: true });
    const setting = settings.findBy('name', 'timetracking');
    const isEnabled = setting && setting.get('toBoolean');

    this.set('isEnabled', isEnabled);
  }),

  isCaseClosed: computed.equal('case.status.statusType', 'CLOSED'),

  isCaseTrashed: computed.equal('case.state', 'TRASH'),

  entries: computed('tracked.entries', function() {
    return this.get('tracked.entries');
  }),

  hasActivities: computed('activities', function() {
    return this.get('activities').isAny('totalTimeSpent');
  }),

  isTimerDirty: computed('timerHours', 'timerMinutes', 'timerSeconds', function() {
    return !!(this.get('timerHours') || this.get('timerMinutes') || this.get('timerSeconds'));
  }),

  fetchTracked: task(function * () {
    const tracked = yield this
      .get('store')
      .queryRecord('timetracking-tracked', {
        case_id: this.get('case.id')
      });

    this.setProperties({
      tracked: tracked,
      timeWorked: tracked.get('worked'),
      timeBilled: tracked.get('billed')
    });
  }).drop(),

  fetchActivities: task(function * () {
    const queryParams = {
      caseId: this.get('case.id')
    };

    if (this.get('plan').has('optimize_ui_fetch')) {
      queryParams.fields = '+case(-custom_fields,-requester,-creator,-last_assigned_by,-form,-last_replier,-last_updated_by),+agent(-organization,-teams,-custom_fields)';
    }

    const activities = yield this
      .get('store')
      .query('timetracking-activity', queryParams);

    this.set('activities', activities);
    this.get('startTracking').perform();
  }).drop(),

  startTracking: task(function * () {
    if (this.get('isCaseClosed') || this.get('isCaseTrashed')) {
      return;
    }

    yield timeout(Ember.testing ? 0 : 30000);

    const response = yield this
      .get('store')
      .createRecord('timetracking-log', {
        case: this.get('case'),
        logType: 'VIEWED',
        timeSpent: 30,
        currentTime: moment().unix(),
        activity: this.get('activity')
      })
      .save();

    yield this.get('fetchActivities').perform();

    if (!Ember.testing) {
      yield timeout(60000);
      yield this.get('updateLog').perform(response);
    }
  }).drop(),

  updateLog: task(function * (response) {
    const log = yield this
      .get('store')
      .findRecord('timetracking-log', response.get('id'));

    log.set('currentTime', moment().unix());
    yield log.save();

    if (this.get('isEnabled')) {
      yield this.get('fetchActivities').perform();
    }
    yield timeout(60000);
    yield this.get('updateLog').perform(response);
  }),

  startTimer: task(function * () {
    while (this.get('isTimerRunning')) {
      this.incrementProperty('timerTotalSeconds');
      this.setProperties({
       timerHours: _.padStart(Math.floor(this.timerTotalSeconds / 3600), 2, 0),
       timerMinutes: _.padStart(Math.floor(this.timerTotalSeconds / 60 % 60), 2, 0),
       timerSeconds: _.padStart(parseInt(this.timerTotalSeconds % 60), 2, 0)
      });
      this.preserveCurrentTimerState();
      yield timeout(1000);
    }
  }).drop(),

  totalSeconds: computed('timerHours', 'timerMinutes', 'timerSeconds', function() {
    const hour = this.get('timerHours') || 0;
    const minutes = this.get('timerMinutes') || 0;
    const seconds = this.get('timerSeconds') || 0;
    return moment.duration(`${hour}:${minutes}:${seconds}`, 'HH:mm:ss').asSeconds();
  }),

  updateEntry: task(function * () {
    let successMessage = '';
    const totalSeconds = this.get('totalSeconds');

    if (this.get('isEditing')) {
      const id = this.get('editingEntry');
      const log = yield this.get('store').findRecord('timetracking-log', id);

      log.set('timeSpent', totalSeconds);

      try {
        yield log.save();
      } catch(error) {
        log.rollbackAttributes();
        totalSeconds.rollbackAttributes();
      }

      this.set('isEditing', false);
      successMessage = this.get('i18n').t('cases.timetracking.messages.update');
    } else {
      if (this.get('isTimerRunning')) {
        this.send('playPauseTimer');
      }
      const newLog = yield this.get('store').createRecord('timetracking-log', {
        agent: this.get('session.user'),
        case: this.get('case'),
        logType: this.get('isBillable') ? 'BILLED' : 'WORKED',
        tracked: this.get('tracked'),
        timeSpent: totalSeconds
      });

      try {
        yield newLog.save();
        if (variation('release-eventTracking')) {
          this.get('metrics').trackEvent({
            event: 'conversation_time_tracked',
            object: this.get('case.id'),
            type: this.get('isBillable') ? 'BILLED' : 'WORKED'
          });
        }
      } catch (error) {
        newLog.rollbackAttributes();
        totalSeconds.rollbackAttributes();
      }

      this.set('editingEntryTime', null);
      successMessage = this.get('i18n').t('cases.timetracking.messages.add');
    }

    const timeDifference = totalSeconds - this.get('editingEntryTime');
    this.incrementProperty('timeWorked', timeDifference);
    if (this.get('isBillable')) {
      this.incrementProperty('timeBilled', timeDifference);
    }

    this.get('notification').add({
      type: 'success',
      title: successMessage,
      autodismiss: true
    });

    this.send('stopTimer');
    this.set('isBillable', false);
  }),

  preserveCurrentTimerState() {
    this.get('preserveTimer')(this.get('timerTotalSeconds'), this.get('isBillable'));
  },

  actions: {
    playPauseTimer() {
      if (!this.get('isTimerRunning')) {
        this.get('startTimer').perform();
      }
      this.toggleProperty('isTimerRunning');
    },

    stopTimer() {
      this.setProperties({
        timerHours: null,
        timerMinutes: null,
        timerSeconds: null,
        timerTotalSeconds: 0,
        isTimerRunning: false,
        isEditing: false,
        isBillable: false
      });

      // Reset timer value from case state
      this.get('preserveTimer')(null, null);
    },

    inputHours(e) {
      this.set('timerHours', e.target.value);
    },

    inputMinutes(e) {
      this.set('timerMinutes', e.target.value);
    },

    inputSeconds(e) {
      this.set('timerSeconds', e.target.value);
    },

    validateInput(e) {
      // Return `false` if not a number
      return !e.charCode || (e.charCode >= 48 && e.charCode <= 57);
    },

    editEntry(e, entry) {
      const duration = moment.duration(entry.get('timeSpent'), 'seconds');

      this.setProperties({
        isEditing: true,
        editingEntry: entry.get('id'),
        editingEntryTime: entry.get('timeSpent'),

        timerHours: _.padStart(duration.hours(), 2, 0),
        timerMinutes: _.padStart(duration.minutes(), 2, 0),
        timerSeconds: _.padStart(duration.seconds(), 2, 0),
      });

      if (entry.get('logType') === 'BILLED') {
        this.set('isBillable', true);
      }
    },

    updateIsBillable(newValue) {
      this.set('isBillable', newValue);
      this.preserveCurrentTimerState();
    },

    deductTotalTime(e, entry) {
      this.decrementProperty('timeWorked', entry.get('timeSpent'));
      if (entry.get('logType') === 'BILLED') {
        this.decrementProperty('timeBilled', entry.get('timeSpent'));
      }
    }
  }
});
