import Service from '@ember/service';
import { A as emberArray } from '@ember/array';
import { inject as service } from '@ember/service';
import RSVP from 'rsvp';
import { debounce } from '@ember/runloop';
import { didCancel } from 'ember-concurrency';
import { assert } from '@ember/debug';
import { getOwner } from '@ember/application';
import { getMetaData } from 'frontend-cp/utils/bugsnag';

import config from 'frontend-cp/config/environment';

/**
 * The ProcessManager is responsible for storing a collection of existing task
 * instances and managing their lifecycle.
 *
 * This manager knows how to serialize and stash any existing processes in
 * sessionStorage and likewise, knows how to restore them.
 *
 * All operations on a process should be run through this class.
 */

export default Service.extend({
  processes: null,
  foregroundProcess: null,

  localStorage: service('localStore'),

  init() {
    this._super(...arguments);

    this.set('processes', emberArray());
  },

  // Public API

  getProcessByPid(pid) {
    let processes = this.get('processes');
    return processes.findBy('pid', pid);
  },

  getOrCreateProcess(obj, type) {
    assert('process type is required', type);

    let process = this._getProcessForModel(obj, type);

    if (!process) {
      let Process = this._getProcessFactory(type);
      let pid = Process.class.generatePid(obj);
      let processes = this.get('processes');

      process = Process.create({ pid });
      processes.pushObject(process);
      process.get('initialize').perform(obj)
        .then(this._scheduleStashProcesses.bind(this))
        .catch(error => {
          if (!didCancel(error)) { throw error; }
        });
    }

    return process;
  },

  restoreProcesses() {
    let localStorage = this.get('localStorage');
    let data = localStorage.getItem(config.localStore.defaultNamespace, 'processes') || [];

    return RSVP.all(data.map(async (json) => {
      try {
        // TODO - remove this once no-one has old process JSON anymore
        json = this._convertLegacyJSON(json);
        let Process = this._getProcessFactory(json.type);
        let process = Process.create({ pid: json.pid });

        await process.get('restore').perform(json);

        this.get('processes').pushObject(process);
      } catch (e) {
        if (!Ember.testing && window.Bugsnag) {
          let context = getMetaData(null, getOwner(this));
          context.json = json;
          window.Bugsnag.notifyException(e, 'Failed to restore process', context, 'info');
        }
      }
    }));
  },

  destroyProcess(process) {
    let processes = this.get('processes');
    let currentProcess = this.get('foregroundProcess');

    if (processes.includes(process)) {
      processes.removeObject(process);
      this._scheduleStashProcesses();
    }

    if (currentProcess === process) {
      this.setForegroundProcess(null);
    }

    process.trigger('willDestroy');

    process.destroy();
  },

  setForegroundProcess(process) {
    let currentProcess = this.get('foregroundProcess');

    if (currentProcess) {
      currentProcess.trigger('willBackground');
    }

    if (process) {
      process.trigger('willForeground');
    }

    this.set('foregroundProcess', process);
  },

  // Private API

  _getProcessForModel(model, type) {
    let Process = this._getProcessFactory(type);
    let pid = Process.class.generatePid(model);

    return this.getProcessByPid(pid);
  },

  _convertLegacyJSON(json) {
    if (!json.type) {
      json.type = json.pid.split(':')[0];
    }

    if (!json.modelId && json.caseId) {
      json.modelId = json.caseId;
    }

    return json;
  },

  _getProcessFactory(type) {
    return getOwner(this).factoryFor(`process:${type}`);
  },

  _scheduleStashProcesses() {
    debounce(this, '_stashProcesses', 100);
  },

  _stashProcesses() {
    if (this.isDestroying || this.isDestroyed) {
      return;
    }

    let localStorage = this.get('localStorage');
    let processes = this.get('processes') || [];

    localStorage.setItem(config.localStore.defaultNamespace, 'processes', processes.map(process => process.serialize()));
  }
});
