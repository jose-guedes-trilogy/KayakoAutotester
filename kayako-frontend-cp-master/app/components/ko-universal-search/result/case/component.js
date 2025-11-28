import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  tagName: '',

  result: null,

  requesterAvatar: computed.readOnly('result.resultData.requester.avatar'),
  agentAvatar: computed.readOnly('result.resultData.assignedAgent.avatar'),
  requesterFullName: computed.readOnly('result.resultData.requester.fullName'),

  status: computed.readOnly('result.resultData.status'),
  updatedAt: computed.readOnly('result.resultData.updatedAt'),

  actions: {
    onClickRemoveIcon: function() {
      this.get('onClickRemoveIcon')('REMOVE', this.get('result'));
    }
  }
});
