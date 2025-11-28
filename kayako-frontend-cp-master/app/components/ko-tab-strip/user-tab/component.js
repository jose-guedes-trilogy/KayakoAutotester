import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  tagName: '',

  tab: null,
  'on-close': () => {},

  user: computed.alias('tab.process.model')

});
