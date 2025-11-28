import { or } from '@ember/object/computed';
import Component from '@ember/component';
import { computed, set } from '@ember/object';
import { inject as service } from '@ember/service';
import { isBlank } from '@ember/utils';

import { task } from 'ember-concurrency';

export default Component.extend({
  // Attributes
  endpoint: null,
  editedEndpoint: null,
  title: null,
  schema: null,

  onSave: () => {},
  onCancel: () => {},
  onDelete: () => {},

  // Services
  confirmation: service(),
  virtualModel: service(),
  plan: service(),

  // CPs
  requestMethods: computed(() => [
    { id: 'GET' },
    { id: 'POST' },
    { id: 'PUT' },
    { id: 'PATCH' },
    { id: 'DELETE' }
  ]),

  requestMethod: computed('editedEndpoint.requestMethod', 'requestMethods', function () {
    const requestMethod = this.get('editedEndpoint.requestMethod');
    return this.get('requestMethods').find(({ id }) => id === requestMethod);
  }),

  requestContentTypes: computed(() => [
    { id: 'FORM' },
    { id: 'XML' },
    { id: 'JSON' }
  ]),

  requestContentType: computed('editedEndpoint.requestContentType', 'requestContentTypes', function () {
    const requestContentType = this.get('editedEndpoint.requestContentType');
    return this.get('requestContentTypes').find(({ id }) => id === requestContentType);
  }),

  showContentType: computed('editedEndpoint.requestMethod', function () {
    return ['POST', 'PUT', 'PATCH'].indexOf(this.get('editedEndpoint.requestMethod')) > -1;
  }),

  isDisabled: or('save.isRunning', 'performDelete.isRunning'),

  // Custom headers management
  maxHeaders: computed(function() {
    return this.get('plan.limits.custom_headers') || 5;
  }),

  canAddHeader: computed('editedEndpoint.webhookCustomHeaders', function() {
    const headers = this.get('parsedHeaders');
    return headers.length < this.get('maxHeaders');
  }),

  // Compute headers from the webhookCustomHeaders string
  parsedHeaders: computed('editedEndpoint.webhookCustomHeaders', function() {
    const jsonString = this.get('editedEndpoint.webhookCustomHeaders') || '{}';
    try {
      const parsed = JSON.parse(jsonString);
      return Object.entries(parsed).map(([key, value]) => ({ key, value }));
    } catch (e) {
      return [];
    }
  }),

  // Format headers for the template
  headers: computed('parsedHeaders', {
    get() {
      return this.get('parsedHeaders');
    },
    set(_, headers) {
      const newHeaders = {};
      headers.forEach(({ key, value }) => {
        newHeaders[key] = value;
      });
      this.set('editedEndpoint.webhookCustomHeaders', JSON.stringify(newHeaders));
      return headers;
    }
  }),

  save: task(function * () {
    const endpoint = this.get('endpoint');
    const editedEndpoint = this.get('editedEndpoint');

    if (!endpoint.get('isNew') && endpoint.get('requestContentType') !== editedEndpoint.get('requestContentType')) {
      yield this.get('confirmation').confirm({
        intlConfirmLabel: 'generic.confirm_button',
        intlConfirmationBody: 'admin.apps.endpoints.confirm_content_change.body',
        intlConfirmationHeader: 'admin.apps.endpoints.confirm_content_change.title'
      });
    }

    yield this.get('virtualModel').save(endpoint, editedEndpoint, this.get('schema'));
    this.get('onSave')();
  }),

  confirmDelete: task(function * () {
    yield this.get('confirmation').confirm({
      intlConfirmationBody: 'admin.apps.endpoints.labels.delete_confirmation',
      intlConfirmationHeader: 'admin.apps.endpoints.labels.confirm_delete',
      intlConfirmLabel: 'generic.confirm.delete_button'
    });
    yield this.get('performDelete').perform();
    this.get('onDelete');
  }),

  performDelete: task(function * () {
    yield this.get('endpoint').destroyRecord();
  }),

  // Method to update auth method and clear irrelevant fields
  _updateAuthMethod(value) {
    const existingValue = this.get('editedEndpoint.webhookAuthMethod');
    if (existingValue === value) return;
    if (!this._storedCredentials) {
      this._storedCredentials = {}; 
    }
  
    const credentialFields = {
      basic: ['webhookUsername', 'webhookPassword'],
      bearer: ['webhookBearerToken'],
      apikey: ['webhookApiKey', 'webhookApiValue']
    };

    const storeCredentials = (method) => {
      if (!credentialFields[method]) return;
      credentialFields[method].forEach(field => {
        this._storedCredentials[field] = this.get(`editedEndpoint.${field}`);
      });
    };

    const clearCredentials = (method) => {
      if (!credentialFields[method]) return;
      let resetFields = {};
      credentialFields[method].forEach(field => {
        resetFields[`editedEndpoint.${field}`] = '';
      });
      this.setProperties(resetFields);
    };

    const restoreCredentials = (method) => {
      if (!credentialFields[method]) return;
      let restoredFields = {};
      credentialFields[method].forEach(field => {
        if (this._storedCredentials[field]) {
          restoredFields[`editedEndpoint.${field}`] = this._storedCredentials[field];
        }
      });
      this.setProperties(restoredFields);
    };

    if (existingValue) {
      storeCredentials(existingValue);
      clearCredentials(existingValue);
    }
    restoreCredentials(value);

    this.setProperties({
      'editedEndpoint.webhookAuthMethod': value,
      'editedEndpoint.webhookUseHttpAuth': value === 'basic' // For backward compatibility
    });
  },

  init() {
    this._super(...arguments);
    if (!this.get('editedEndpoint.webhookAuthMethod')) {
      this.set('editedEndpoint.webhookAuthMethod', 'none'); // Default to none if not set
    }

    if (this.get('editedEndpoint.webhookUseHttpAuth')) {
      this.set('editedEndpoint.webhookAuthMethod', 'basic'); // For backward compatibility
    }

    // Initialize custom headers array if not present
    if (!this.get('editedEndpoint.webhookCustomHeaders')) {
      this.set('editedEndpoint.webhookCustomHeaders', JSON.stringify({}));
    }
  },

  // Authentication method CP
  authMethod: computed('editedEndpoint.webhookAuthMethod', {
    get() {
      return this.get('editedEndpoint.webhookAuthMethod');
    },
    set(_, value) {
      this._updateAuthMethod(value);
      return value;
    }
  }),

  actions: {
    changeAuthMethod(value) {
      this._updateAuthMethod(value);
    },

    // Custom headers actions
    addHeader() {
      let headers = this.get('headers');
      let hasEmptyName = false;
      let hasEmptyValue = false;
      
      // Check for empty keys and values and mark them for highlighting
      headers.forEach(header => {
        if (isBlank(header.key)) {
          set(header, 'hasError', true);
          hasEmptyName = true;
        } else {
          set(header, 'hasError', false);
        }
        if (isBlank(header.value)) {
          set(header, 'valueError', true);
          hasEmptyValue = true;
        } else {
          set(header, 'valueError', false);
        }
      });

      // If there are empty keys or values, don't add a new header
      if (hasEmptyName || hasEmptyValue) { return; }

      if (this.get('canAddHeader')) {
        this.set('headers', [...headers, { key: '', value: '' }]);
      }
    },

    removeHeader(header) {
      const newHeaders = this.get('headers').filter(h => h !== header);
      this.set('headers', newHeaders);
    },

    updateHeaderPair(header, attr, e) {
      set(header, attr, e.target.value);
      
      // Clear error state when user types in the name field
      if (attr === 'key' && !isBlank(e.target.value)) {
        set(header, 'hasError', false);
      }

      // Clear error state when user types in the value field
      if (attr === 'value' && !isBlank(e.target.value)) {
        set(header, 'valueError', false);
      }

      this.set('headers', this.get('headers').slice());
    }
  }
});
