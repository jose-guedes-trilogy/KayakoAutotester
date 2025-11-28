import Component from '@ember/component';
import { computed } from '@ember/object';
import uuid from 'npm:uuid/v4';
import { run } from '@ember/runloop';
import { get } from '@ember/object';
import { camelize } from '@ember/string';
import { inject as service } from '@ember/service';
import stableJSON from 'npm:json-stable-stringify';
import diffAttrs from 'ember-diff-attrs';
import { assign } from '@ember/polyfills';
import config from 'frontend-cp/config/environment';
import { attrChanged } from 'frontend-cp/utils/diff-attrs';

export default Component.extend({
  localClassNames: 'app',

  processManager: service(),
  ajax: service(),
  session: service(),

  installedApp: null,
  prompts: null,
  app: null,
  slot: null,
  instance: null,

  case: null,
  user: null,
  organization: null,

  width: 0,
  height: 0,

  didReceiveAttrs: diffAttrs('case', 'user', 'organization', 'slot', 'app', function(changedAttrs, ...args) {
    this._super(...args);

    if (!changedAttrs || attrChanged(changedAttrs.case, 'id') || attrChanged(changedAttrs.user, 'id') || attrChanged(changedAttrs.organization, 'id') || changedAttrs.slot || changedAttrs.app) {
      this.removeAllEventListeners();

      this.setProperties({
        width: 0,
        height: 0,
        instance: uuid()
      });

      if (this.channel) {
        this.channel.port1.close();
        this.channel.port2.close();
        this.channel = null;
      }
    }
  }),

  src: computed('slot.url', 'instance', function() {
    const url = this.get('slot.url');
    if (!url) {
      return;
    }
    const instance = this.get('instance');
    return `${url}?_instance=${instance}`; // TODO - use hash? or at least check if we already have params
  }),

  initMessageChannel() {
    this.channel = new MessageChannel();
    this.channel.port1.onmessage = (msg) => {
      run(() => this.handleMessage(msg) );
    };

    const data = this.get('prompts');
    const iframe = this.$('iframe')[0].contentWindow;
    iframe.postMessage({ event: 'setup', ref: uuid(), data }, '*', [this.channel.port2]);
  },

  handleMessage(msg) {
    const handlerName = camelize(`handle_${msg.data.event}`);
    const handlerFunc = this[handlerName];
    if (handlerFunc) {
      handlerFunc.call(this, msg);
    } else {
      this.replyWithError(msg, 'unknown_event', `Received unknown event "${msg.data.event}"`);
    }
  },

  handleDimensionsChanged(msg) {
    const { width, height } = msg.data.payload;

    if (width >= 0 && height >= 0) {
      this.setProperties({ width, height });
      this.replyTo(msg, { status: 'ok' });
    } else {
      this.replyWithError(msg, 'dimensions_invalid', 'Dimensions must be >= 0');
    }
  },

  handleGetData(msg) {
    this.replyTo(msg, {
      status: 'ok',
      data: this.serialize(msg.data.payload.path)
    });
  },

  handleAddEventListener(msg) {
    const type = msg.data.payload.type;

    // only change is supported currently
    if (type !== 'change') {
      return this.replyWithError(msg, 'unknown_event_listener_type', `Cannot add event listener for unknown type "${type}"`);
    }

    const path = msg.data.payload.path;

    let resource = path.split('.').shift();
    if (!['case', 'user', 'organization'].includes(resource)) {
      return this.replyWithError(msg, 'unknown_event_listener_path', `Cannot add event listener for unknown path "${path}"`);
    }

    const subscription = uuid();

    let lastValue = stableJSON(this.serialize(path));

    const listener = () => {
      if (!this.channel) {
        return;
      }

      const data = this.serialize(path);

      // ensure the path being listened to has actually changed
      const stringified = stableJSON(data);
      if (stringified === lastValue) {
        return;
      }
      lastValue = stringified;

      this.channel.port1.postMessage({
        ref: uuid(),
        event: 'event',
        payload: {
          type: 'change',
          subscription,
          data
        }
      });
    };

    let remove;
    switch (resource) {
      case 'case': {
        const process = this.get('processManager').getOrCreateProcess(this.get('case'), 'case');
        const state = process.get('state');
        state.on('updated', listener);
        remove = () => state.off('updated', listener);
        break;
      }

      case 'user': {
        const process = this.get('processManager').getOrCreateProcess(this.get('user'), 'user');
        const state = process.get('state');
        state.on('updated', listener);
        remove = () => state.off('updated', listener);
        break;
      }

      case 'organization': {
        const process = this.get('processManager').getOrCreateProcess(this.get('organization'), 'organization');
        const state = process.get('state');
        state.on('updated', listener);
        remove = () => state.off('updated', listener);
        break;
      }
    }

    this._eventListeners[subscription] = {
      remove,
      listener
    };

    this.replyTo(msg, {
      status: 'ok',
      subscription
    });
  },

  handleRemoveEventListener(msg) {
    const listenerData = this._eventListeners[msg.data.payload.subscription];
    if (!listenerData) {
      return this.replyWithError(msg, 'subscription_reference_invalid', `No event listener found for subscription reference "${msg.data.payload.subscription}"`);
    }

    listenerData.remove();
    delete this._eventListeners[msg.data.payload.subscription];

    this.replyTo(msg, { status: 'ok' });
  },

  removeAllEventListeners() {
    const listeners = this._eventListeners || {};
    Object.keys(listeners).forEach(key => {
      listeners[key].remove();
    });
    this._eventListeners = {};
  },

  handleRemoteRequest(msg) {
    if (msg.data.payload.url.match(/^\/api\//)) {
      this._apiRequest(msg);
    } else {
      this._proxyRequest(msg);
    }
  },

  _apiRequest(msg) {
    // bypasses adapter because user may want custom headers, non-flat mode etc…
    this.get('ajax').raw(msg.data.payload.url, {
      method: msg.data.payload.method,
      data: msg.data.payload.data,
      headers: assign({}, msg.data.payload.headers || {}, {
        'X-CSRF-Token': this.get('session.csrfToken'),
        'X-Session-ID': this.get('session.sessionId')
      })
    })
    .then(response => {
      this.replyTo(msg, {
        status: 'ok',
        response: {
          body: response.jqXHR.responseText,
          status: response.jqXHR.status,
          headers: {} // TODO - extract from response.jqXHR.getAllResponseHeaders()
        }
      });
    })
    .catch(e => {
      this.replyWithError(msg, 'unknown', 'Something went wrong'); // TODO
    });
  },

  _proxyRequest(msg) {
    this.get('ajax').post(`${config.appsApiUrl}/proxy`, {
      contentType: 'application/json',
      headers: {
        'X-Session-ID': this.get('session.sessionId'),
        'X-User-Agent': window.navigator.userAgent,
        'X-Instance-Domain': this.get('session.session.instanceName')
      },
      data: {
        id: this.get('installedApp.id'),
        payload: msg.data.payload
      },
    }).then(responseBody => {
      this.replyTo(msg, { status: 'ok', response: responseBody.data });
    }).catch(e => {
      this.replyWithError(msg, 'unknown', 'Something went wrong'); // TODO
    });
  },

  serialize(path) {
    const data = {};

    if (this.get('case')) {
      assign(data, {
        case: {
          id: this.get('case.id'),
          subject: this.get('case.subject'),
          requestor: {
            id: this.get('user.id'),
            fullName: this.get('user.fullName'),
            email: this.get('user.primaryEmail.email')
          }
        }
      });
    }

    if (this.get('user')) {
      assign(data, {
        user: {
          id: this.get('user.id'),
          fullName: this.get('user.fullName'),
          email: this.get('user.primaryEmail.email')
        }
      });
    }

    if (this.get('organization')) {
      assign(data, {
        organization: {
          id: this.get('organization.id'),
          name: this.get('organization.name')
        }
      });
    }

    if (path) {
      return get(data, path);
    } else {
      return data;
    }
  },

  replyTo(msg, payload) {
    if (!this.channel) {
      return;
    }

    this.channel.port1.postMessage({
      payload,
      event: 'reply',
      ref: msg.data.ref
    });
  },

  replyWithError(msg, code, message) {
    this.replyTo(msg, { status: 'error', code, message });
  },

  actions: {
    iframeLoaded() {
      this.initMessageChannel();
    }
  }
});
