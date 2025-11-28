import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import he from 'npm:he';

export default Component.extend({
  tagName: '',

  tab: null,
  'on-close': () => {},

  // Services
  socket: service(),
  i18n: service(),
  session: service(),
  processManager: service(),
  window: service(),

  conversation: computed.reads('tab.process.model'),

  // CPs
  showPill: computed('processManager.foregroundProcess', 'tab.process', 'window.visible', function() {
    let foregroundProcess = this.get('processManager.foregroundProcess');
    let currentProcess = this.get('tab.process');
    let windowIsFocussed = this.get('window.visible');

    return !windowIsFocussed || (currentProcess !== foregroundProcess);
  }),

  label: computed('tab.process.model.subject', '_requesterIsTyping', function() {
    let requesterIsTyping = this.get('_requesterIsTyping');
    let caseSubject = he.unescape(this.get('tab.process.model.subject'));

    if (requesterIsTyping) {
      return this.get('i18n').t('cases.realtimeTyping', {
        total: 1,
        sentence: ''
      });
    }

    return caseSubject;
  }),
  caseRequester: computed.alias('tab.process.model.requester'),
  caseChannel: computed.alias('tab.process.model.realtimeChannel'),

  _casePresence: null,

  willDestroyElement() {
    this._super(...arguments);
    this.updatePresenceMeta({ is_viewing: false });
  },

  updatePresenceMeta(meta = {}) {
    const caseChannelName = this.get('caseChannel');
    if (!caseChannelName) {
      return;
    }

    const socket = this.get('socket');
    if (!socket.hasJoinedChannel(caseChannelName)) {
      return;
    }

    socket.push(caseChannelName, 'update-presence-meta', meta);
  },

  _requesterIsTyping: computed('_casePresence', 'caseRequester', 'session.user', function() {
    const data = this.get('_casePresence');
    if (!data) { return false; }

    const id = this.get('caseRequester.id');
    const loggedInUserId = this.get('session.user.id');

    if (id === loggedInUserId) { return false; }

    const metas = (data[id] && data[id].metas) || [];

    return metas.filterBy('is_typing', true).length > 0;
  })
});
