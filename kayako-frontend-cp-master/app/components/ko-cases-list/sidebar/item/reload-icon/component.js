import Component from '@ember/component';
import { computed } from '@ember/object';
import { task } from 'ember-concurrency';
import { htmlSafe } from '@ember/string';

import animation from 'frontend-cp/lib/animation';

const SPIN_TIME = 1000;

export default Component.extend({
  // Attributes:
  isRefreshingCases: null,
  casesView: null,
  currentCachedView: null,

  // State:
  currentDegrees: 0,

  // CPs
  iconStyle: computed('currentDegrees', function () {
    return htmlSafe(`transform: rotate(${this.get('currentDegrees')}deg)`);
  }),

  didReceiveAttrs() {
    if (this.get('currentCachedView') === this.get('casesView')) {
      if (this.get('isRefreshingCases') && !this.get('spin.isRunning')) {
        this.get('spin').perform();
      }
    } else {
      this.get('spin').cancelAll();
    }
  },

  spin: task(function * () {
    let animateTask;
    try {
      animateTask = animation.get('animate').perform(time => {
        const newDegrees = Math.round(time % SPIN_TIME / SPIN_TIME * 360);

        if (!this.get('isRefreshingCases') && newDegrees <= this.get('currentDegrees')) {
          return false;
        }

        this.set('currentDegrees', newDegrees);
      });
      yield animateTask;
    } finally {
      animateTask.cancel();
      this.set('currentDegrees', 0);
    }
  }).drop()
});
