import Component from '@ember/component';
import { inject as service } from '@ember/service';

export default Component.extend({
  store: service(),
  i18n: service(),

  backgroundMode: 'gradient',
  primaryColor: '#F1703F',
  activeSolidColor: '#FF3B30',
  activeGradient: '-192deg, #40364D 37%, #9B4779 100%',
  activePattern: '1',
  existingStyle: '',

  gradients: [
    '-192deg, #40364D 37%, #9B4779 100%',
    '-134deg, #CE287E 0%, #FF3B30 100%',
    '-134deg, #F34E8B 0%, #FFEA01 100%',
    '-134deg, #FFCC00 0%, #53DB91 100%',
    '-134deg, #23A975 0%, #BAD33B 100%',
    '-134deg, #0DDFA9 0%, #5AC8FA 100%',
    '-134deg, #581F7E 0%, #5195F8 100%',
    '-180deg, #62A8FD 0%, #9E80F3 100%',
    '-180deg, #77EFD8 0%, #45BAF2 100%',
    '-180deg, #F9BF66 0%, #F95C81 100%',
    '-180deg, #B6B7F8 0%, #F5ACCC 100%',
    '-180deg, #FFE35A 0%, #FFB064 100%',
    '-180deg, #F387BC 0%, #A26FED 100%',
    '-180deg, #E7EE9D 0%, #5BF2B9 100%',
    '0deg, #5F6BE4 0%, #73BDEB 100%',
    '-180deg, #FD9786 0%, #F567DC 100%',
    '0deg, #889CFF 0%, #9BE1D3 100%',
    '-180deg, #B7F2EB 0%, #8ADDEB 100%',
    '-180deg, #86CFEC 0%, #789AEC 100%',
    '-180deg, #E5EBA4 0%, #A7DA7C 100%',
    '-180deg, #A2ACF1 0%, #B482D3 100%',
    '0deg, #F25555 0%, #FB72AE 100%'
  ],
  solidColors: ['#FF3B30', '#FF9500', '#FFCC00', '#4CD964', '#5AC8FA', '#007AFF', '#5856D6'],
  patterns: [false, '1', '2', '3', '4', '5', '6', '7', '8', '9'],

  actions: {
    switchBackgroundStyle(mode) {
      if (mode === 'color') {
        this.set('backgroundMode', 'color');
      } else {
        this.set('backgroundMode', 'gradient');
      }
    },

    updateColor(color) {
      this.set('activeSolidColor', color);
    },

    updateGradient(gradient) {
      this.set('activeGradient', gradient);
    },

    updatePattern(pattern) {
      this.set('activePattern', pattern);
    },

    primaryColorChanged(color) {
      if (/^#\w{3}$|^#\w{6}$/.test(color)) {
        this.set('primaryColor', color);
      }
    },
  }
});
