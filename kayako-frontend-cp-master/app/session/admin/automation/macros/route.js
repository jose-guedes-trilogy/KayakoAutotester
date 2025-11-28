import Route from '@ember/routing/route';
import EmberObject from '@ember/object';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import RSVP from 'rsvp';

export default Route.extend({
  store: service(),
  i18n: service(),

  model() {
    let { store, i18n } = this.getProperties('store', 'i18n');

    return RSVP.hash({
      priorities: store.findAll('case-priority'),
      caseTypes: store.findAll('case-type'),
      caseStatuses: store.findAll('case-status'),
      replyTypes: [
        {
          id: 'REPLY',
          value: i18n.findTranslationByKey('admin.macros.actions.reply_type.reply')
        }, {
          id: 'NOTE',
          value: i18n.findTranslationByKey('admin.macros.actions.reply_type.note')
        }
      ],
      agents: store.query('user', { role: 'agent', limit: 500 }),
      teams: store.findAll('team'),
      macroDefinitions: this.store.findAll('macro-action-definition')
    });
  },

  setupController(controller, model) {
    let referenceData = {
      actionDefinitions: this._actionDefinitions(model),
      teams: model.teams
    };

    controller.set('referenceData', referenceData);
  },

  _actionDefinitions({ priorities, caseTypes, caseStatuses, replyTypes, agents, teams, macroDefinitions }) {
    let i18n = this.get('i18n');

    let peopleWithTeams = [
      { id: 'UNASSIGNED', value: i18n.findTranslationByKey('admin.macros.assign.unassigned') },
      { id: 'CURRENT_AGENT', value: i18n.findTranslationByKey('admin.macros.assign.current_agent') }
    ];

    teams.forEach(team => {
      peopleWithTeams.pushObject({
        id: team.get('id'),
        value: team.get('title')
      });
    });

    agents.forEach(agent => {
      agent.get('teams').forEach(team => {
        peopleWithTeams.pushObject({
          id: [team.id, agent.id].filter(item => !!item).join('-'),
          value: team.get('title') + ' \\ ' + agent.get('fullName')
        });
      });
    });

    priorities = priorities
      .toArray()
      .sortBy('level')
      .map(priority => {
        return {
          id: priority.get('id'),
          value: priority.get('label')
        };
      });

    caseTypes = caseTypes
      .toArray()
      .sortBy('id')
      .map(caseType => {
        return {
          id: caseType.get('id'),
          value: caseType.get('label')
        };
      });

    caseStatuses = caseStatuses
      .toArray()
      .sortBy('sortOrder')
      .filter(item => ['New', 'Closed'].indexOf(item.get('label')) === -1)
      .map(status => {
        return {
          id: status.get('id'),
          value: status.get('label')
        };
      });

    const additionalMacroDefinitions = macroDefinitions
      .toArray()
      .map(macroDefinition => {
        return EmberObject.create({
          groupLabel: computed.alias('label'),
          inputType: macroDefinition.get('inputType'),
          valueType: macroDefinition.get('valueType'),
          label: macroDefinition.get('label'),
          name: macroDefinition.get('name'),
          options: macroDefinition.get('options'),
          values: Object.entries(macroDefinition.get('values')).map(([id, value]) => ({ id, value }))
        });
      });


    return [
      EmberObject.create({
        groupLabel: computed.alias('label'),
        inputType: 'PLAIN-TEXT',
        valueType: 'STRING',
        label: i18n.findTranslationByKey('admin.macros.actions.reply_contents.label'),
        name: 'reply-contents',
        options: ['CHANGE'],
        values: replyTypes
      }),

      EmberObject.create({
        groupLabel: computed.alias('label'),
        inputType: 'OPTIONS',
        valueType: 'STRING',
        label: i18n.findTranslationByKey('admin.macros.actions.reply_type.label'),
        name: 'reply-type',
        options: ['CHANGE'],
        values: replyTypes
      }),

      EmberObject.create({
        groupLabel: computed.alias('label'),
        inputType: 'CASCADING_SELECT',
        valueType: 'STRING',
        label: i18n.findTranslationByKey('admin.macros.actions.assignee.label'),
        name: 'assignee',
        options: ['CHANGE'],
        values: peopleWithTeams
      }),

      EmberObject.create({
        groupLabel: computed.alias('label'),
        inputType: 'OPTIONS',
        valueType: 'NUMERIC',
        label: i18n.findTranslationByKey('admin.macros.actions.status.label'),
        name: 'status',
        options: ['CHANGE'],
        values: caseStatuses
      }),

      EmberObject.create({
        groupLabel: computed.alias('label'),
        inputType: 'OPTIONS',
        valueType: 'NUMERIC',
        label: i18n.findTranslationByKey('admin.macros.actions.type.label'),
        name: 'case-type',
        options: ['CHANGE'],
        values: caseTypes
      }),

      EmberObject.create({
        groupLabel: computed.alias('label'),
        inputType: 'TAGS',
        valueType: 'COLLECTION',
        label: i18n.findTranslationByKey('admin.macros.actions.add_tags.label'),
        name: 'add-tags',
        options: ['ADD'],
        values: ''
      }),

      EmberObject.create({
        groupLabel: computed.alias('label'),
        inputType: 'TAGS',
        valueType: 'COLLECTION',
        label: i18n.findTranslationByKey('admin.macros.actions.remove_tags.label'),
        name: 'remove-tags',
        options: ['REMOVE'],
        values: ''
      }),

      EmberObject.create({
        groupLabel: computed.alias('label'),
        inputType: 'OPTIONS',
        valueType: 'NUMERIC',
        label: i18n.findTranslationByKey('admin.macros.actions.priority.label'),
        name: 'priority',
        options: ['CHANGE', 'INCREASE', 'DECREASE'],
        values: priorities
      }),

      ...additionalMacroDefinitions
    ];
  }
});
