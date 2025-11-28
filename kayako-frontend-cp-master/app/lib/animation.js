import EmberObject from '@ember/object';
import RSVP from 'rsvp';
import { task } from 'ember-concurrency';

export function raf() {
  return new RSVP.Promise((resolve, reject) => {
    window.requestAnimationFrame(resolve);
  });
}

export default EmberObject.extend({
  animate: task(function * (cb) {
    const startTime = yield raf();
    let nextTime = startTime;
    while (true) { // eslint-disable-line no-constant-condition
      if (cb(nextTime - startTime) === false) { // eslint-disable-line callback-return
        return;
      }
      nextTime = yield raf();
    }
  })
}).create();
