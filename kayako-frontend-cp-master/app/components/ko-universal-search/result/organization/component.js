import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  tagName: '',

  result: null,

  domains: computed.readOnly('result.resultData.domains')
});
