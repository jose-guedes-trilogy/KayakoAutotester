import { inject as service } from '@ember/service';
import { equal } from '@ember/object/computed';
import $ from 'jquery';
import Component from '@ember/component';
import EmberObject, { get, computed } from '@ember/object';
import { on } from '@ember/object/evented';
import { task } from 'ember-concurrency';
import * as KeyCodes from 'frontend-cp/lib/keycodes';
import propositionStyles from 'frontend-cp/components/ko-admin/predicate-builder/proposition/styles';
import predicateBuilderStyles from 'frontend-cp/components/ko-admin/predicate-builder/styles';

export default Component.extend({
  // Attributes
  caseView: null,
  editedCaseView: null,
  title: null,
  schema: null,
  onCancel: () => {},
  onDelete: () => {},
  onSuccess: () => {},

  // State
  teams: [],
  definitions: null,
  availableColumns: [],

  // Services
  confirmation: service(),
  store: service(),
  i18n: service(),
  virtualModel: service(),

  // CPs
  sharedWithSelf: equal('editedCaseView.visibilityType', 'SELF'),
  sharedWithAll: equal('editedCaseView.visibilityType', 'ALL'),
  sharedWithTeam: equal('editedCaseView.visibilityType', 'TEAM'),

  titleOrSharingEditDisabled: computed('save.isRunning', 'caseView.viewType', function () {
    return this.get('save.isRunning') || this.get('caseView.viewType') === 'INBOX';
  }),

  canBeDeleted: computed('caseView.isNew', 'caseView.viewType', function () {
    let view = this.get('caseView');
    return !view.get('isNew') && !['INBOX', 'TRASH'].includes(view.get('viewType'));
  }),

  sortingDirections: computed(function() {
    return [
      EmberObject.create({id: 'ASC', value: this.get('i18n').t('generic.sort.ASC')}),
      EmberObject.create({id: 'DESC', value: this.get('i18n').t('generic.sort.DESC')})
    ];
  }),

  initAvailableColumns: on('init', function() {
    this.get('store').findAll('column').then(columns => {
      this.set('availableColumns', columns);
    });
  }),

  initDefinitions: on('init', function() {
    this.set('definitions', this.get('store').query('definition', { type: 'view' }));
  }),

  initTeams: on('init', function() {
    this.get('store').findAll('team').then(teams => {
      this.set('teams', teams);
    });
  }),

  // CPs
  availableTeams: computed('teams.@each.id', 'selectedTeams.@each.id', function () {
    const editedTeamIds = this.get('selectedTeams').mapBy('id');
    return this.get('teams').filter(team => editedTeamIds.indexOf(team.get('id')) === -1);
  }),

  selectedTeams: computed('editedCaseView.visibilityToTeams.[]', function () {
    return this.get('editedCaseView.visibilityToTeams').toArray();
  }),

  orderedAvailableColumnList: computed('availableColumns.[]', function() {
    return this.get('availableColumns').sortBy('title');
  }),

  sortOrderDirections: computed(function () {
    return [
      {
        label: this.get('i18n').t('generic.sort.ASC'),
        direction: 'ASC'
      },
      {
        label: this.get('i18n').t('generic.sort.DESC'),
        direction: 'DESC'
      }
    ];
  }),

  selectedSortableColumn: computed('editedCaseView.orderByColumn', 'availableColumns.[]', function() {
    const columns = this.get('availableColumns');
    const selectedColumn = this.get('editedCaseView.orderByColumn');

    return columns.findBy('id', selectedColumn);
  }),

  selectedSortingDirection: computed('editedCaseView.orderBy', function() {
    const sortOrderDirections = this.get('sortOrderDirections');
    const sortDirection = this.get('editedCaseView.orderBy');

    return sortOrderDirections.findBy('direction', sortDirection);
  }),

  save: task(function * () {
    const caseView = this.get('caseView');
    yield this.get('virtualModel').save(caseView, this.get('editedCaseView'), this.get('schema'));

    caseView.get('predicateCollections')
      .forEach(predicateCollection =>
        predicateCollection.get('propositions')
          .filter(proposition => proposition.get('isNew'))
          .forEach(proposition => proposition.unloadRecord())
      );

    caseView.get('predicateCollections')
      .filter(predicateCollection => predicateCollection.get('isNew'))
      .forEach(predicateCollection => predicateCollection.unloadRecord());

    this.get('onSuccess')();
  }).drop(),

  actions: {
    cancel() {
      this.get('onCancel')();
    },

    setViewSharingSelf() {
      this.set('editedCaseView.visibilityType', 'SELF');
      this.get('editedCaseView.visibilityToTeams').clear();
    },

    setViewSharingAll() {
      this.set('editedCaseView.visibilityType', 'ALL');
      this.get('editedCaseView.visibilityToTeams').clear();
    },

    setViewSharingTeam() {
      this.set('editedCaseView.visibilityType', 'TEAM');
    },

    addCollection() {
      this.get('editedCaseView.predicateCollections').pushObject({
        propositions: [{}]
      });
    },

    removeCollection(predicateCollection, id) {
      const element = $('#' + id);
      element.addClass(predicateBuilderStyles.containerRemoving);
      element.fadeTo(400, 0, () => {
        this.get('editedCaseView.predicateCollections').removeObject(predicateCollection);
      });
    },

    addPropositionToCollection(predicateCollection) {
      get(predicateCollection, 'propositions').pushObject({});
    },

    removePropositionFromCollection(predicateCollection, proposition, id) {
      const element = $('#' + id);
      element.addClass(propositionStyles.containerRemoving);
      element.fadeTo(400, 0, () => {
        get(predicateCollection, 'propositions').removeObject(proposition);
      });
    },

    selectOrderByColumn(column) {
      this.set('editedCaseView.orderByColumn', column.id);
    },

    selectOrderByDirection(sortOrder) {
      this.set('editedCaseView.orderBy', sortOrder.direction);
    },

    deleteView() {
      return this.get('confirmation').confirm({
        intlConfirmLabel: 'generic.confirm.delete_button',
        intlConfirmationBody: 'admin.views.confirm_delete.body',
        intlConfirmationHeader: 'admin.views.confirm_delete.title'
      }).then(() => {
        return this.get('caseView').destroyRecord().then(() => {
          this.get('onDelete')();
        });
      });
    },

    selectTeam(team) {
      this.set('editedCaseView.visibilityType', 'TEAM');
      this.get('editedCaseView.visibilityToTeams').setObjects(team);
    },

    addColumn(column) {
      this.get('editedCaseView.columns').pushObject(column);
    },

    removeColumn(column) {
      this.get('editedCaseView.columns').removeObject(column);
    },

    reorderColumn(list) {
      this.get('editedCaseView.columns').setObjects(list);
    },

    preventFormSubmission(_, e) {
      if (e.keyCode === KeyCodes.enter) {
        e.preventDefault();
      }
    }
  }
});
