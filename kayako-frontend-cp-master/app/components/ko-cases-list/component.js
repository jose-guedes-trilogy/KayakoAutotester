import EmberObject from '@ember/object';
import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import $ from 'jquery';
import { scheduleOnce } from '@ember/runloop';
import KeyboardShortcuts from 'ember-keyboard-shortcuts/mixins/component';
import { task } from 'ember-concurrency';
import styles from './styles';
import computeSelected from 'frontend-cp/utils/compute-selected';

export default Component.extend(KeyboardShortcuts, {
  tagName: '',

  // Attributes
  activeView: null,
  isLoading: false,
  cases: [],
  onCaseListSort: null,
  onClick: () => {},
  columns: [],
  title: null,
  orderBy: null,
  onSetSelectedCaseIds: () => {},
  onTrashCases: () => {},
  afterMerge: () => {},
  trashable: false,
  isTrash: false,
  selectedCaseIds: null,
  orderByColumn: null,
  currentFocusedID: null,

  bulkService: service('case-bulk-update'),
  i18n: service(),
  notification: service(),
  permissions: service(),
  confirmation: service(),
  session: service(),
  store: service(),
  mergeConversation: service(),
  caseListTab: service(),

  keyboardShortcuts: {
    space: {
      action: 'toggleCaseSelect',
      preventDefault: true,
      global: false
    }
  },

  init() {
    this._super(...arguments);
    this._casesToUpdate = {};
  },

  //Lifecycle Hooks
  didReceiveAttrs() {
    this._super(...arguments);
    scheduleOnce('afterRender', this, 'scrollToFocusedCaseIfOutOfView');
  },

  //CP's
  hasPermissionToTrashCases: computed(function() {
    return this.get('permissions').has('cases.trash');
  }),

  hasPermissionToEmptyTrash: computed(function() {
    return this.get('session.user.role.isAdminOrHigher');
  }),

  columnList: computed('columns.[]', function() {
    const conversationTitle = this.get('i18n').t('cases.columns.conversation');
    let columns = this.get('columns').filter(column => column.id !== 'subject' && column.id !== 'requesterid');
    return [EmberObject.create({
      id: 'conversation', name: 'conversation', title: conversationTitle, disableSorting: true
    }), ...columns.toArray()];
  }),

  isSomeChecked: computed.gt('selectedCaseIds.length', 0),
  isUpdatingCases: computed.or('trashCases.isRunning', 'emptyTrash.isRunning'),

  isEverythingChecked: computed('selectedCaseIds.length', 'cases.length', function() {
    let selected = this.get('selectedCaseIds.length');
    let total = this.get('cases.length');

    return selected === total && total > 0;
  }),

  //Methods
  scrollToFocusedCaseIfOutOfView() {
    if(this.get('cases') && this.get('cases').mapBy('id').length === 0 && this.get('cases.query.offset') > 0) {
      this.get('caseListTab').refresh();
    }

    let parent = $(`.${styles.container}`).parent();
    let child = $(`.${styles['row--focused']}`);

    if (child.length) {
      let parentBox = parent[0].getBoundingClientRect();
      let childBox = child[0].getBoundingClientRect();

      if (parentBox.bottom < childBox.bottom) {
        parent.scrollTop(parent.scrollTop() + childBox.bottom - parentBox.bottom);
      }

      if (childBox.top < parentBox.top) {
        parent.scrollTop(parent.scrollTop() + childBox.top - parentBox.top);
      }
    }
  },

  classForRow(rowCase, trashable) {
    let classes = [styles.row];
    if (trashable && rowCase.get('state') === 'TRASH') {
      classes.push(styles['row--trashed']);
    }
    return classes.join(' ');
  },

  minWidthForColumn(columnName) {
    if (columnName === 'conversation') {
      return 300;
    } else {
      return 80;
    }
  },

  maxWidthForColumn(columnName) {
    let mediumWidthColumns = [
      'casestatusid',
      'casepriorityid',
      'casetypeid',
      'brandid'
    ];

    let smallWidthColumns = [
      'caseid'
    ];

    if (mediumWidthColumns.includes(columnName)) {
      return 100;
    } else if (smallWidthColumns.includes(columnName)) {
      return 70;
    } else if (columnName === 'conversation') {
      return null;
    } else {
      return 150;
    }
  },

  updateCase: task(function * (caseToUpdate) {
    if (!this._casesToUpdate[caseToUpdate.get('id')]) {
      return;
    }
    Reflect.deleteProperty(this._casesToUpdate, caseToUpdate.get('id'));
    yield caseToUpdate.reload();
  }).enqueue(),

  trashCases: task(function * () {
    return yield this.get('confirmation').confirm({
      intlConfirmationBody: 'generic.confirm.trashcases'
    }).then(() => {
      return this.get('bulkService').trashCases(this.get('selectedCaseIds')).then(() => {
        this.attrs.onTrashCases();
        this.get('notification').success(this.get('i18n').t('generic.casestrashed'));
      }).catch(() => {
        this.get('notification').error(this.get('i18n').t('generic.case_trashing_failed'));
      });
    });
  }),

  mergeCases: task(function * () {
    let store = this.get('store');
    let mergeConversation = this.get('mergeConversation');
    let ids = this.get('selectedCaseIds');
    let cases = ids.map(id => store.peekRecord('case', id));
    let skipSelection = true;
    let afterMerge = this.get('afterMerge');

    let primary = yield mergeConversation.confirm({ cases, skipSelection });

    if (afterMerge) {
      afterMerge(primary);
    }
  }).drop(),

  emptyTrash: task(function * () {
    return yield this.get('confirmation').confirm({
      intlConfirmationHeader: 'generic.confirm.emptytrash.header',
      intlConfirmationBody: 'generic.confirm.emptytrash.body',
      intlConfirmLabel: 'generic.confirm.emptytrash.confirm',
      confirmButtonType: 'alert'
    }).then(() => {
      return this.get('store').adapterFor('case').emptyTrash().then(() => {
        this.attrs.onTrashCases();
        this.get('notification').success(this.get('i18n').t('generic.casestrashed'));
      }).catch(() => {
        this.get('notification').error(this.get('i18n').t('generic.case_trashing_failed'));
      });
    });
  }),

  actions: {
    enqueueCaseUpdate(caseToUpdate) {
      this._casesToUpdate[caseToUpdate.get('id')] = true;
      this.get('updateCase').perform(caseToUpdate);
    },

    toggleCheck(rowCase, checked, shiftKey) {
      const selectedCaseIds = [...this.get('selectedCaseIds')];

      if (shiftKey && selectedCaseIds.length) {
        const allCaseIds = this.get('cases').mapBy('id');
        const selectedRows = computeSelected(rowCase.id, checked, selectedCaseIds, allCaseIds);
        this.attrs.onSetSelectedCaseIds(selectedRows);
        return;
      }

      if (checked) {
        selectedCaseIds.push(rowCase.id);
      } else {
        selectedCaseIds.removeObject(rowCase.id);
      }

      this.attrs.onSetSelectedCaseIds(selectedCaseIds);
    },

    selectAll() {
      this.get('onSetSelectedCaseIds')(this.get('cases').mapBy('id'));
    },

    deselectAll() {
      this.get('onSetSelectedCaseIds')([]);
    },

    toggleCaseSelect() {
      const selectedCaseIds = [...this.get('selectedCaseIds')];
      const currentFocusedID = this.get('currentFocusedID');
      if (!currentFocusedID) {
        return;
      }

      if (selectedCaseIds.includes(currentFocusedID)) {
        selectedCaseIds.removeObject(currentFocusedID);
      } else {
        selectedCaseIds.addObject(currentFocusedID);
      }

      this.attrs.onSetSelectedCaseIds(selectedCaseIds);
    }
  }
});
