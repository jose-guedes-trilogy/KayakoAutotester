import Process from './process';
import EmberObject from '@ember/object';
import { get } from '@ember/object';

const UserNewProcess = Process.extend({
  type: 'user-new',

  restoreModel(json) {
    return EmberObject.create({
      creationTimestamp: json.modelId
    });
  },

  serialize() {
    return {
      pid: this.get('pid'),
      type: this.get('type'),
      modelId: this.get('model.creationTimestamp')
    };
  }
});

UserNewProcess.reopenClass({
  generatePid(model) {
    let id = get(model, 'creationTimestamp');
    return `user-new:${id}`;
  }
});

export default UserNewProcess;
