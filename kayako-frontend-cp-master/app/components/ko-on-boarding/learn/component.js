import Ember from 'ember';
import Component from '@ember/component';
import { inject as service } from '@ember/service';
import KeyboardShortcuts from 'ember-keyboard-shortcuts/mixins/component';

export default Component.extend(KeyboardShortcuts, {
  session: service(),
  onBoardingStatus: service(),

  isRedirected: null,
  showGuide: false,
  isComplete: false,
  imageGroups: [
    [1],
    [2, 3],
    [4, 5, 6]
  ],
  activeGroup: 0,
  activeStep: 1,
  videoPlayer: null,
  testingMode: Ember.testing,

  keyboardShortcuts: {
    esc: 'close',
    left: 'previousStep',
    right: 'nextStep'
  },

  init() {
    this._super(...arguments);

    if (this.get('isRedirected') === 'true') {
      this.set('showGuide', true);
    }

    if (this.get('onBoardingStatus.progress.learn_kayako_completed')) {
      this.set('isComplete', true);
    }

    this.setupVideoPlayer();
  },

  setupVideoPlayer() {
    window._wq = window._wq || [];
    window._wq.push({
      id: '1gr5j956ux',
      options: {
        playerColor: '#4eafcb'
      },
      onHasData: video => {
        this.set('videoPlayer', video);
      }
    });
  },

  _changeGroup(step) {
    const group = this.get('imageGroups').findIndex(group => group.includes(step));

    if (group !== this.get('activeGroup')) {
      this.set('activeGroup', group);
    }
  },

  actions: {
    show() {
      this.set('showGuide', true);
    },

    close() {
      this.setProperties({
        showGuide: false,
        activeGroup: 0,
        activeStep: 1
      });
    },

    changeStep(step) {
      this._changeGroup(step);
      this.set('activeStep', step);
    },

    nextStep() {
      const activeStep = this.get('activeStep');

      if (this.get('videoPlayer') && activeStep === 1) {
        this.get('videoPlayer').pause();
      }

      if(activeStep < 6) {
        this._changeGroup(activeStep + 1);
        this.incrementProperty('activeStep');
      } else {
        this.send('close');
        if(!this.get('isComplete')) {
          this.set('isComplete', true);
          this.onComplete();
        }
      }
    },

    previousStep() {
      const activeStep = this.get('activeStep');

      if(activeStep > 1) {
        this._changeGroup(activeStep - 1);
        this.decrementProperty('activeStep');
      }
    }
  }
});
