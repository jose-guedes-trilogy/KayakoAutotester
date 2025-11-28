import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';

export default Component.extend({
  tagName: '',

  // Attributes
  activity: null,
  caseFields: null,

  // Services
  i18n: service(),
  store: service(),

  // CPs
  coercedActions: computed('activity.actions', function() {
    let agentChange = this.get('activity.actions').find((action) => {
      return action.get('field') === 'assigneeagentid' &&
        action.get('newObject') !== null;
    });
    let teamChange = this.get('activity.actions').find((action) => {
      return action.get('field') === 'assigneeteamid' &&
        action.get('newObject') !== null;
    });

    if (agentChange && teamChange) {
      let nonAssigneeActions = this.get('activity.actions').filter((action) => {
        return action.get('field') !== 'assigneeagentid' &&
          action.get('field') !== 'assigneeteamid';
      });

      let assigneeAction = {
        field: 'coercedassignee',
        teamName: teamChange.get('newValue'),
        agentObject: agentChange.get('newObject'),
        agentName: agentChange.get('newValue')
      };

      return [assigneeAction, ...nonAssigneeActions];
    } else {
      return this.get('activity.actions');
    }
  }),

  summaryLineActions: computed('coercedActions', function() {
    return this.get('coercedActions').slice(0, 2);
  }),

  actionsNotOnSummaryLine: computed('coercedActions', function() {
    let actions = this.get('coercedActions').toArray();
    return actions.slice(2, actions.length);
  }),

  hasActionsNotOnSummaryLine: computed.gt('coercedActions.length', 2),

  caseStatusType: function (statusId) {
    return this.get('store').peekRecord('case-status', statusId).get('statusType');
  },

  localizedSummaryStringForField: function (fieldName, oldValue, newValue) {
    const i18n = this.get('i18n');
    switch (fieldName) {
      case 'assigneeteamid':
        return i18n.formatHtmlMessage('timeline.activity.team', { team: newValue });
      case 'assigneeagentid':
        return i18n.formatHtmlMessage('timeline.activity.agent', { agent: newValue });
    }

    // If field was set to nothing/empty
    if (!newValue) {
      switch (fieldName) {
        case 'casepriorityid':
          return i18n.formatHtmlMessage('timeline.activity.priority_to_nothing', { priority: newValue });
        case 'casetypeid':
          return i18n.formatHtmlMessage('timeline.activity.type_to_nothing', { type: newValue });
        case 'name':
        case 'tags':
          return i18n.formatHtmlMessage('timeline.activity.tags_to_nothing', { tags: newValue });
        case 'organizationid':
          return i18n.formatHtmlMessage('timeline.activity.organization_to_nothing', { field: newValue });
        default:
          const customField = this.get('caseFields').findBy('key', fieldName);
          let customFieldName;

          if (customField) {
            customFieldName = customField.get('title');
          } else {
            customFieldName = fieldName;
          }

          return i18n.formatHtmlMessage('timeline.activity.default_from_something', { fieldName: customFieldName, value: newValue });
      }
    }
    // If field value was changed from an existing value
    else if (oldValue) {
      switch (fieldName) {
        case 'subject':
          return i18n.formatHtmlMessage('timeline.activity.subject_from_something', { subject: newValue });
        case 'requesterid':
          return i18n.t('timeline.activity.requesterid_from_something');
        case 'casestatusid':
          return i18n.formatHtmlMessage('timeline.activity.status_from_something', { status: newValue });
        case 'casepriorityid':
          return i18n.formatHtmlMessage('timeline.activity.priority_from_something', { priority: newValue });
        case 'casetypeid':
          return i18n.formatHtmlMessage('timeline.activity.type_from_something', { type: newValue });
        case 'name':
        case 'tags':
          return i18n.formatHtmlMessage('timeline.activity.tags_from_something', { tags: newValue });
        case 'caseformid':
          return i18n.formatHtmlMessage('timeline.activity.form_from_something', { form: newValue });
        case 'brandid':
          return i18n.formatHtmlMessage('timeline.activity.brand_from_something', { field: newValue });
        case 'organizationid':
          return i18n.formatHtmlMessage('timeline.activity.organization_from_something', { field: newValue });
        default:
          const customField = this.get('caseFields').findBy('key', fieldName);
          let customFieldName;

          if (customField) {
            customFieldName = customField.get('title');
          } else {
            customFieldName = fieldName;
          }

          if (!newValue) {
            newValue = i18n.t('timeline.property_empty_value');
          }

          return i18n.formatHtmlMessage('timeline.activity.default_from_something', { fieldName: customFieldName, value: newValue });
      }
    }
    // If field value was changed from a non existing value
    else {
      switch (fieldName) {
        case 'subject':
          return i18n.formatHtmlMessage('timeline.activity.subject_from_nothing', { subject: newValue });
        case 'casestatusid':
          return i18n.formatHtmlMessage('timeline.activity.status_from_nothing', { status: newValue });
        case 'casepriorityid':
          return i18n.formatHtmlMessage('timeline.activity.priority_from_nothing', { priority: newValue });
        case 'casetypeid':
          return i18n.formatHtmlMessage('timeline.activity.type_from_nothing', { type: newValue });
        case 'name':
        case 'tags':
          return i18n.formatHtmlMessage('timeline.activity.tags_from_nothing', { tags: newValue });
        case 'caseformid':
          return i18n.formatHtmlMessage('timeline.activity.form_from_nothing', { form: newValue });
        case 'organizationid':
          return i18n.formatHtmlMessage('timeline.activity.organization_from_nothing', { field: newValue });
        default:
          const customField = this.get('caseFields').findBy('key', fieldName);
          let customFieldName;

          if (customField) {
            customFieldName = customField.get('title');
          } else {
            customFieldName = fieldName;
          }

          return i18n.formatHtmlMessage('timeline.activity.default_from_nothing', { fieldName: customFieldName, value: newValue });
      }
    }
  }
});
