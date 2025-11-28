import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  tagName: '',

  result: null,

  creatorAvatar: computed.readOnly('result.resultData.creator.avatar'),
  creatorFullName: computed.readOnly('result.resultData.creator.fullName'),
  updatedAt: computed.readOnly('result.resultData.updatedAt'),
  status: computed.readOnly('result.resultData.status'),
  statusLabel: computed('status', function() {
    return `generic.${this.get('status').toLowerCase()}`;
  }),

  section: computed.readOnly('result.resultData.section')
});
