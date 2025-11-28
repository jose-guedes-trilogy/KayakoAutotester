import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  channel: null,
  channels: null,
  qaClass: null,
  isNote: false,
  onclick: () => {},
  onchange: () => {},

  // HTML
  tagName: '',

  // CPs
  disabled: computed('isNote', 'channel.channelType', function () {
    let isNote = this.get('isNote');
    let channelType = this.get('channel.channelType');

    return isNote && channelType && channelType !== 'NOTE';
  }),

  actions: {
    handleMouseDown(e) {
      if (this.get('disabled')) {
        e.stopPropagation();
        this.get('onclick')(...arguments, e);
      }
    }
  }
});
