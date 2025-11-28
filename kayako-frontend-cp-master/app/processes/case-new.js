import Process from './process';
import EmberObject from '@ember/object';
import { get } from '@ember/object';

const CaseNewProcess = Process.extend({
  type: 'case-new',

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

CaseNewProcess.reopenClass({
  generatePid(model) {
    let id = get(model, 'creationTimestamp');
    return `case-new:${id}`;
  }
});

export default CaseNewProcess;
