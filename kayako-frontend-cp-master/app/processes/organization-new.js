import Process from './process';
import EmberObject from '@ember/object';
import { get } from '@ember/object';

const OrganizationNewProcess = Process.extend({
  type: 'organization-new',

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

OrganizationNewProcess.reopenClass({
  generatePid(model) {
    let id = get(model, 'creationTimestamp');
    return `organization-new:${id}`;
  }
});

export default OrganizationNewProcess;
