import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';

export default Component.extend({
  session: service(),
  i18n: service(),
  onBoardingStatus: service(),

  progress: 0,
  learnKayakoFraction: 28,
  individualStepFraction: 12,
  isRedirected: null,

  init() {
    this._super(...arguments);
    this.setInitialProgress();
  },

  greeting: computed(function() {
    const i18n = this.get('i18n');
    const hours = new Date().getHours();

    if (hours >= 0 && hours < 12) {
      return i18n.t('onboarding.greeting.morning');
    } else if (hours >= 12 && hours < 17) {
      return i18n.t('onboarding.greeting.afternoon');
    } else {
      return i18n.t('onboarding.greeting.evening');
    }
  }),

  progressCSS: computed('progress', function() {
    return `transform: translateX(${this.get('progress')}%)`;
  }),

  setInitialProgress() {
    const progress = this.get('onBoardingStatus.progress');
    const individualStepValue = this.get('individualStepFraction');

    if (progress.learn_kayako_completed) {
      this.incrementProperty('progress', this.get('learnKayakoFraction'));
    }

    if (progress.account_setup) {
      this.incrementProperty('progress', individualStepValue);
    }

    if (progress.account_connected) {
      this.incrementProperty('progress', individualStepValue);
    }

    if (progress.setup) {
      this.incrementProperty('progress', individualStepValue);
    }

    if (progress.team_added) {
      this.incrementProperty('progress', individualStepValue);
    }

    if (progress.agent_added) {
      this.incrementProperty('progress', individualStepValue);
    }

    if (this.get('onBoardingStatus.completedCases') > 2) {
      this.incrementProperty('progress', individualStepValue);
    }
  },

  actions: {
    completeLearnSection() {
      this.incrementProperty('progress', this.get('learnKayakoFraction'));
      this.get('onBoardingStatus').updateStatus(
        'learn_kayako_completed', { 'user.learn_kayako_completed': '1' }
      );
    },

    completeStep() {
      this.incrementProperty('progress', this.get('individualStepFraction'));
    }
  }
});
