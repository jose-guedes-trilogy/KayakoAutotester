import Ember from 'ember';
import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import { run } from '@ember/runloop';
import moment from 'moment';

export default Component.extend({
  // Attributes:
  user: null,

  timezones: service(),
  i18n: service(),

  // HTML
  tagName: '',


  // CPs
  userTimeZone: computed('user.timeZone', function() {
    return this.get('timezones.timeZones').findBy('id', this.get('user.timeZone'));
  }),

  userMomentTime: computed('user.timeZone', function () {
    const timezone = this.get('user.timeZone');

    if (!timezone) {
      return null;
    }

    return moment.tz(moment(), timezone);
  }),

  timeIcon: computed('userMomentTime', function() {
    const userMomentTime = this.get('userMomentTime');

    if (!userMomentTime) {
      return null;
    }

    const hours = userMomentTime.hours();
    return hours >= 6 && hours < 18 ? 'day' : 'night';
  }),

  content: computed('userMomentTime', function() {
    const now = this.get('userMomentTime');
    const i18n = this.get('i18n');
    const format = 'time';
    const timeZone = this.get('user.timeZone');
    const time = i18n.formatTime(now, { format, timeZone });

    return i18n.t('cases.timezone.currently', { time });
  }),

  // Tick logic
  didInsertElement() {
    this.tick();
  },

  tick() {
    if (!Ember.testing) {
      run.later(this, function () {
        this.notifyPropertyChange('user.timeZone');
        this.tick();
      }, 60000);
    }
  },

  willDestroyElement() {
    run.cancel(this.get('nextTick'));
  }
});
