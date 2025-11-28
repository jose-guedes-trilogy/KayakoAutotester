import EmberObject from '@ember/object';
import { task } from 'ember-concurrency';
import { inject as service } from '@ember/service';
import Evented from '@ember/object/evented';
import { get } from '@ember/object';

/**
 * A process instance is intended to function somewhat like a tab process in
 * Chrome.
 *
 * Our app supports opening cases, users, etc in tabs (within our application)
 * and we want to be able to have these tabs perform tasks in the background,
 * even if they are not the currently active tab.
 *
 * In order to do this, we are going to keep a collection of these long lived
 * process instances that will be responsible for running different tasks such
 * as fetching data or subscribing to channels etc.
 *
 * In general, for each application tab, there will be a corresponding
 * background process, however, not every process will necessarily correspond to
 * a tab.
 *
 * Processes can be serialized and saved to sessionStorage and therefore should
 * know how to `restore` themselves.
 *
 * When a process is destroyed, it will cancel any tasks that it currently has
 * running. By destroying a process, we can simply throw away all associated state
 * in one motion.
 *
 * Process Events
 * ==============
 *
 * The following are lifecycle events that one can hook in to in order to run
 * code at different points in the process' lifecycle.
 *
 * - `willForeground`
 * - `willBackground`
 * - `willDestroy`
 */

const Process = EmberObject.extend(Evented, {
  store: service(),

  pid: null,
  model: null,
  type: null,

  initialize: task(function * (model) {
    yield this.setup(model);
  }).drop(),

  restore: task(function * (json) {
    let model = yield this.restoreModel(json);
    yield this.setup(model);
  }),

  restoreModel(json) {
    return this.get('store').findRecord(this.get('type'), json.modelId);
  },

  setup(model) {
    this.set('model', model);
  },

  serialize() {
    return {
      pid: this.get('pid'),
      type: this.get('type'),
      modelId: this.get('model.id')
    };
  },

  destroy() {
    this._super(...arguments);
  }
});

Process.reopenClass({
  generatePid(model) {
    let id = get(model, 'id');
    let type = model.constructor.modelName;
    return `${type}:${id}`;
  }
});

export default Process;
