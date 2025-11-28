import Process from './process';
import { inject as service } from '@ember/service';

export default Process.extend({
  type: 'case',
  socket: service(),
  store: service(),

  setup(model) {
    this._super(...arguments);
    this.connectToChannel(model);
    model.addObserver('realtimeChannel', () => this.connectToChannel(model));
  },

  connectToChannel(model) {
    const channelName = model.get('realtimeChannel');
    if(!channelName){
      return;
    }
    this._channel = this.get('socket').channel(channelName).lock();

    this._channel.on('CHANGE', this, 'onChange');
    this._channel.on('NEW_POST', this, 'onNewPost');
    this._channel.on('CHANGE_POST', this, 'onChangePost');
    this._channel.join();
  },

  onChange(data) {
    const caseState = this.get('state');
    if (caseState) {
      caseState.updateCaseFromKRE(data);
    }
  },

  onNewPost() {
    const timeline = this.get('timeline');
    if (timeline) {
      timeline.get('fetchNewerFromKRE').perform();
    }
  },

  onChangePost(data) {
    const post = this.get('store').peekRecord('post', data.resource_id);
    if (post) {
      post.reload();
    }
  },

  destroy() {
    this._super(...arguments);

    if (this._channel) {
      this._channel.off('CHANGE', this, 'onChange');
      this._channel.off('NEW_POST', this, 'onNewPost');
      this._channel.off('CHANGE_POST', this, 'onChangePost');
      this._channel.unlock();
    }
  }

});
