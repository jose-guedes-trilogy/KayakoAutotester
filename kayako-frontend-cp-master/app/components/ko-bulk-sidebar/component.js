import { or } from '@ember/object/computed';
import { A } from '@ember/array';
import Component from '@ember/component';
import EmberObject, { get, computed } from '@ember/object';
import { inject as service } from '@ember/service';
import { task, timeout } from 'ember-concurrency';
import _ from 'npm:lodash';
import EditedCustomFields from 'frontend-cp/lib/edited-custom-fields';
import { variation } from 'ember-launch-darkly';

const convertErrorsToMap = (errors) => {
  return (errors || []).filter((error) => error.parameter).reduce((errorMap, error) => {
    errorMap.set(error.parameter, true);
    return errorMap;
  }, Ember.Object.create({}));
};

export default Component.extend({
  tagName: '',

  //Attributes
  selectedCaseIds: null,

  //State
  assignedTeam: null,
  assignedAgent: null,
  caseStatus: null,
  casePriority: null,
  caseType: null,
  tags: [],
  statuses: [],
  types: [],
  priorities: [],
  assigneeField: { title: 'Assignee' },
  isAssigneeEdited: false,
  isCaseStatusEdited: false,
  isCaseTypeEdited: false,
  isCasePriorityEdited: false,
  isTagsFieldEdited: false,
  isSaving: false,
  customFields: null,
  customFieldsState: null,

  //Serivces
  store: service(),
  i18n: service(),
  bulkService: service('case-bulk-update'),
  notification: service(),
  agentCache: service('cache/agent-cache'),
  customFieldsList: service('custom-fields/list'),

  //Initializers
  init() {
    this._super(...arguments);
    this.resetState();
    this.fetchReferenceData();
    this.resetSelections();
    this.get('fetchAgents').perform();
    this.get('fetchCustomFields').perform();
  },

  resetState() {
    this.set('tags', []);
  },

  fetchReferenceData() {
    const store = this.get('store');

    this.set('statuses', store.findAll('case-status'));
    this.set('types', store.findAll('case-type'));
    this.set('priorities', store.findAll('case-priority'));
  },

  resetSelections() {
    this.setProperties({
      assignedTeam: null,
      assignedAgent: null,
      isAssigneeEdited: null,
      isCaseStatusEdited: false,
      isCaseTypeEdited: false,
      isCasePriorityEdited: false,
      caseStatus: this.getNoChangesItem(),
      caseType: this.getNoChangesItem(),
      casePriority: this.getNoChangesItem(),
      isTagsFieldEdited: false,
      tags: A()
    });
  },

  getNoChangesItem() {
    return EmberObject.create({
      id: -1,
      label: this.get('i18n').t('generic.no_changes')
    });
  },

  createCustomFieldItems(customFields) {
    return customFields.map(field => {
      if (field.get('fieldType') === 'CHECKBOX') {
        return EmberObject.create({ field, value: null });
      }
      return EmberObject.create({ field, value: '' });
    });
  },

  //CP's
  bulkCaseStatuses: computed('statuses.[]', function() {
    const apiCaseStatuses = this.get('statuses').toArray();

    return [this.getNoChangesItem(), ...apiCaseStatuses.filter((caseStatus) => {
      return ['NEW', 'CLOSED'].indexOf(caseStatus.get('statusType')) === -1;
    })];
  }),

  bulkCaseTypes: computed('types.[]', function() {
    return [
      this.getNoChangesItem(),
      EmberObject.create({ label: '-' }),
      ...this.get('types').toArray()
    ];
  }),

  bulkCasePriorities: computed('priorities.[]', function() {
    return [
      this.getNoChangesItem(),
      EmberObject.create({ label: '-' }),
      ...this.get('priorities').toArray()
    ];
  }),

  isEdited: or('isAssigneeEdited', 'isCaseStatusEdited', 'isCaseTypeEdited', 'isCasePriorityEdited', 'isTagsFieldEdited', 'customFieldsState.isEdited'),

  // Methods
  suggestTags: task(function * (searchTerm) {
    yield timeout(300);
    const addNewMessage = this.get('i18n').t('generic.addtagname', { tag: searchTerm });
    const data = yield this.get('store').query('tag', { name: searchTerm });
    const exactMatch = !!data.toArray().findBy('name', searchTerm) || !!this.get('tags').findBy('name', searchTerm);
    return _.difference(data.mapBy('name'), this.get('tags').mapBy('name'))
      .map(name => ({ name }))
      .concat(exactMatch ? [] : [{ name: addNewMessage, actualName: searchTerm }]);
  }).restartable(),

  fetchAgents: task(function * () {
    if (this.get('agents')) { return; }

    const agentCache = this.get('agentCache');
    const agents = yield agentCache.getAgents();

    this.set('agents', agents);
  }).restartable(),

  fetchCustomFields: task(function * () {
    let customFields = yield this.get('store').findAll('case-field');

    customFields = customFields.filterBy('isSystem', false);
    this.set('customFields', customFields);

    let originalCustomFields = this.createCustomFieldItems(customFields);
    let editedCustomFields = this.createCustomFieldItems(customFields);

    let customFieldsState = EditedCustomFields.create({ originalCustomFields, editedCustomFields });
    this.set('customFieldsState', customFieldsState);
  }).restartable(),

  //Actions
  actions: {
    setAssignee(team, agent) {
      if (team === null && agent === null) {
        this.set('assignedTeam', null);
        this.set('assignedAgent', null);
        this.set('isAssigneeEdited', false);
      } else {
        this.set('assignedTeam', team);
        this.set('assignedAgent', agent);
        this.set('isAssigneeEdited', true);
      }
    },

    setCaseStatus(caseStatus) {
      if (caseStatus && caseStatus.get('id') === -1) {
        this.set('caseStatus', this.getNoChangesItem());
        this.set('isCaseStatusEdited', false);
      } else {
        this.set('caseStatus', caseStatus);
        this.set('isCaseStatusEdited', true);
      }
    },

    setCaseType(caseType) {
      if (caseType && caseType.get('id') === -1) {
        this.set('caseType', this.getNoChangesItem());
        this.set('isCaseTypeEdited', false);
      } else {
        this.set('caseType', caseType);
        this.set('isCaseTypeEdited', true);
      }
    },

    setCasePriority(casePriority) {
      if (casePriority && casePriority.get('id') === -1) {
        this.set('casePriority', this.getNoChangesItem());
        this.set('isCasePriorityEdited', false);
      } else {
        this.set('casePriority', casePriority);
        this.set('isCasePriorityEdited', true);
      }
    },

    addTag(newTag) {
      const name = get(newTag, 'actualName') || get(newTag, 'name');
      const editedTags = this.get('tags');
      if (editedTags.find(tag => get(tag, 'name') === name)) {
        return;
      }
      editedTags.pushObject({ name });
      this.set('isTagsFieldEdited', true);
    },

    removeTag(tag) {
      const tags = this.get('tags');
      tags.removeObject(tag);
      if (!tags.length) { this.set('isTagsFieldEdited', false); }
    },

    submit() {
      const bulkService = this.get('bulkService');
      const options = {};
      if (this.get('assignedTeam')) { options.assignedTeam = this.get('assignedTeam'); }
      if (this.get('assignedAgent')) { options.assignedAgent = this.get('assignedAgent'); }
      if (this.get('caseStatus.id') !== -1) {
        options.caseStatus = this.get('caseStatus');
      }
      if (this.get('casePriority.id') !== -1) {
        options.casePriority = this.get('casePriority');
      }
      if (this.get('caseType.id') !== -1) {
        options.caseType = this.get('caseType');
      }
      if (this.get('tags').length) {
        options.tags = this.get('tags');
      }

      if (variation('release-sidebar-custom-fields')) {
        let fields = this.get('customFieldsState.editedCustomFields');
        let usedFields = fields.filterBy('value');

        if (usedFields.length) {
          options.fieldValues = usedFields.reduce((result, field) => {
            result[field.get('field.key')] = field.get('value');
            return result;
          }, {});
        }
      }

      this.set('isSaving', true);

      bulkService.updateCases(
        this.get('selectedCaseIds'),
        options
      ).then(() => {
        this.get('notification').add({
          type: 'success',
          title: this.get('i18n').t('cases.cases.updated'),
          autodismiss: true
        });

        this.set('isSaving', false);
        this.sendAction('onBulkUpdateCases');
        this.resetSelections();
      }).catch((e) => {
        this.set('isSaving', false);
        if (variation('release-sidebar-custom-fields')) {
          this.set('errorMap', convertErrorsToMap(e.errors));
        }
      });
    },

    cancel() {
      this.sendAction('onCancel');
    },

    setCustomField(field, value) {
      if (value) {
        value = get(value, 'id') || value;
      }
      this.get('customFieldsState').setValue(field, value);
    }
  }
});
