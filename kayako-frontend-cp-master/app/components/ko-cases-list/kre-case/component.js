import Component from '@ember/component';
import { task } from 'ember-concurrency';

export default Component.extend({
  tagName: '',

  reloadCase: task(function * () {
    this.get('on-update')();
  }).keepLatest()

});
