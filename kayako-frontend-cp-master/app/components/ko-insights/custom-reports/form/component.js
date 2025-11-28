import Component from '@ember/component';
import { task } from 'ember-concurrency';
import jQuery from 'jquery';
import { get } from '@ember/object';
import { inject as service } from '@ember/service';
import { not } from '@ember/object/computed';
import { computed } from '@ember/object';
import EmberObject from '@ember/object';
import propositionStyles from 'frontend-cp/components/ko-admin/predicate-builder/proposition/styles';
import predicateBuilderStyles from 'frontend-cp/components/ko-admin/predicate-builder/styles';
import * as KeyCodes from 'frontend-cp/lib/keycodes';

export default Component.extend({
  virtualModel: service(),
  confirmation: service(),
  store: service(),
  reportsService: service('reports'),
  notification: service('notification'),
  i18n: service(),

  schema: null,
  definitions: null,
  editedReport: null,

  init() {
    this._super(...arguments);
    this.initTeams();
    this.updatePreview();
  },

  initTeams() {
    this.set('teams', []);
    this.get('store').findAll('team').then(teams => {
      this.set('teams', teams);
    });
  },

  visibilities: ['PUBLIC', 'PRIVATE', 'TEAM'],
  canBeDeleted: not('report.isNew'),

  availableTeams: computed('teams.@each.id', 'editedReport.visibilityToTeams.@each.id', function () {
    const editedTeamIds = this.get('editedReport.visibilityToTeams').mapBy('id');
    return this.get('teams').filter(team => editedTeamIds.indexOf(team.get('id')) === -1);
  }),

  save: task(function * () {
    const report = this.get('report');

    if (this.get('editedReport.visibility') === 'TEAM' && this.get('editedReport.visibilityToTeams').length === 0) {
      this.get('notification').add({
        type: 'error',
        title: this.get('i18n').t('generic.validation_errors'),
        autodismiss: true,
        dismissable: true
      });

      return false;
    }

    yield this.get('virtualModel').save(report, this.get('editedReport'), this.get('schema'));

    report.get('predicateCollections')
      .forEach(predicateCollection =>
        predicateCollection.get('propositions')
          .filter(proposition => proposition.get('isNew'))
          .forEach(proposition => proposition.unloadRecord())
      );

    report.get('predicateCollections')
      .filter(predicateCollection => predicateCollection.get('isNew'))
      .forEach(predicateCollection => predicateCollection.unloadRecord());

    this.get('onSuccess')();
  }).drop(),

  updatePreview() {
    let collections = this.get('editedReport.predicateCollections');

    // only preview if we have at least one full predicate
    let canPreview = collections.any(collection => {
      return collection.get('propositions').any(proposition => {
        let { field, operator, value } = proposition.getProperties('field', 'operator', 'value');
        return field && operator && value;
      });
    });

    // clone to ensure we pass a new Array through so it triggers re-calculation
    if (canPreview) {
      this.set('previewPredicates', [...collections]);
    } else {
      this.set('previewPredicates', []);
    }
  },

  actions: {

    download() {
      this.get('reportsService').download(this.get('report'));
    },

    cancel() {
      this.get('onCancel')();
    },

    delete() {
      return this.get('confirmation').confirm({
        intlConfirmLabel: 'generic.confirm.delete_button',
        intlConfirmationBody: 'insights.custom_reports.confirm_delete.body',
        intlConfirmationHeader: 'insights.custom_reports.confirm_delete.title'
      }).then(() => {
        return this.get('report').destroyRecord().then(() => {
          this.get('onDelete')();
        });
      });
    },

    addCollection() {
      this.get('editedReport.predicateCollections').pushObject(EmberObject.create({
        propositions: [EmberObject.create()]
      }));
      this.updatePreview();
    },

    removeCollection(predicateCollection, id) {
      const element = jQuery(`#${id}`);
      element.addClass(predicateBuilderStyles.containerRemoving);
      element.fadeTo(400, 0, () => {
        this.get('editedReport.predicateCollections').removeObject(predicateCollection);
        this.updatePreview();
      });
    },

    createPropositionForCollection(predicateCollection) {
      get(predicateCollection, 'propositions').pushObject(EmberObject.create());
      this.updatePreview();
    },

    removePropositionFromCollection(predicateCollection, proposition, id) {
      const element = jQuery(`#${id}`);
      element.addClass(propositionStyles.containerRemoving);
      element.fadeTo(400, 0, () => {
        get(predicateCollection, 'propositions').removeObject(proposition);
        this.updatePreview();
      });
    },

    propositionChanged() {
      this.updatePreview();
    },

    preventFormSubmission(_, e) {
      if (e.keyCode === KeyCodes.enter) {
        e.preventDefault();
      }
    }
  }

});
