import Service from '@ember/service';
import { getOwner } from '@ember/application';
import RSVP from 'rsvp';
import { task, timeout } from 'ember-concurrency';
import moment from 'moment';
import { variation } from 'ember-launch-darkly';

import { getMetaData } from 'frontend-cp/utils/bugsnag';

export const DONK = 'alert-01';
const LIGHTSABER = '21c5b96';
const BLASTER = '01a4c70';

const SOUNDS = [
  { key: DONK, path: '/sounds/donk.mp3' },
  { key: LIGHTSABER, path: '/sounds/21c5b96.mp3' },
  { key: BLASTER, path: '/sounds/01a4c70.mp3' }
];

const NullAudio = function() { };
NullAudio.prototype.play = function() {
  return RSVP.resolve();
};

export default Service.extend({
  sounds: null,

  init() {
    this._super(...arguments);

    this._sounds = {};
  },

  initializeSounds() {
    const AudioClass = window.Audio || NullAudio;

    let sounds = SOUNDS.reduce((sounds, props) => {
      let sound = new AudioClass(props.path);

      sounds[props.key]= sound;

      return sounds;
    }, {});

    this._sounds = sounds;
  },

  play(filename) {
    if (variation('ops-new-message-pill-sound-enhancement')) {
      // <base64>U3RhciBXYXJzIERheSBFYXN0ZXIgRWdnLiBNYXkgdGhlIDR0aCBCZSBXaXRoIFlvdSE=</base64>

      if (this._shouldEnhance() || variation('ops-force-sound-enhancement')) {
        let sound = this.get('_sound');

        if (!sound) {
          let sounds = [LIGHTSABER, BLASTER];
          sound = sounds[Math.floor(Math.random() * sounds.length)];

          this.set('_sound', sound);
        }

        return this.get('_play').perform(sound);
      }
    }

    return this.get('_play').perform(filename);
  },

  _play: task(function * (filename) {
    let sound = this._sounds[filename];

    if (sound) {
      let result = yield sound.play()
        .catch((reason) => {
          let error = new Error(`Error playing sound file: ${reason} : ${filename}`);
          let context = getMetaData(null, getOwner(this));
          window.Bugsnag.notifyException(error, 'Error playing sound file', context, 'error');
        });

      yield timeout(1500);

      return result;
    } else {
      let error = new Error(`Unrecognized sound file: ${filename}`);
      let context = getMetaData(null, getOwner(this));
      window.Bugsnag.notifyException(error, 'Unrecognized sound file', context, 'error');

      return RSVP.resolve();
    }
  }).drop(),

  _shouldEnhance() {
    let m = moment();
    let month = m.month();
    let day = m.date();

    return month === 4 && day === 4;
  }
});
