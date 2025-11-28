import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  tagName: '',

  tab: null,
  'on-close': () => {},

  label: computed.readOnly('tab.process.model.id')
});
