import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import { task, timeout } from 'ember-concurrency';
import config from 'frontend-cp/config/environment';
import diffAttrs from 'ember-diff-attrs';
import { get } from '@ember/object';

import lodash from 'npm:lodash';

const PAGE_LIMIT = config.orgListPageSize;

export default Component.extend({
  tagName: '',

  //Attrs
  definitions: null,
  page: 1,

  //State
  currentPredicateCollections: null,
  currentPropositionOperators: null,
  currentCollectionOperator: null,
  totalRecords: null,
  totalResults: null,
  lastRunQuery: null,

  //Serivces
  store: service(),
  locale: service(),
  router: service('-routing'),

  //Lifecycle Hooks
  init() {
    this._super(...arguments);
    this.set('currentPredicateCollections', new Map());
    this.set('currentPropositionOperators', new Map());
    this.set('currentCollectionOperator', 'OR');
    this.set('lastRunQuery', []);

    let currentPropositionOperators = this.get('currentPropositionOperators');
    let definitions = this.get('definitions');
    definitions.forEach((definition) => {
      currentPropositionOperators.set(definition.get('label').toLowerCase(), 'OR');
    });
  },

  didReceiveAttrs: diffAttrs('page', function(changedAttrs, ...args) {
    this._super(...args);
    if (!changedAttrs || changedAttrs.page) {
      this.fetchOrganizationsWithCompletePropositions();
    }
  }),

  //CP's
  organizations: reads('fetchOrganizations.lastSuccessful.value'),

  totalPages: computed('totalRecords', function() {
    const totalRecords = this.get('totalRecords');
    return Math.ceil(totalRecords / PAGE_LIMIT);
  }),

  //Actions
  actions: {
    removeAllPropositions(proposition) {
      let predicateCollections = this.get('currentPredicateCollections');
      let fieldLabel = get(proposition, 'label').toLowerCase();

      predicateCollections.delete(fieldLabel);

      this.notifyPropertyChange('currentPredicateCollections');

      this.fetchOrganizationsWithCompletePropositions();
    },

    removePropositions(i, proposition) {
      let predicateCollections = this.get('currentPredicateCollections');
      let fieldLabel = proposition.label.toLowerCase();

      if (predicateCollections.has(fieldLabel)) {
        let predicateCollection = predicateCollections.get(fieldLabel);

        if (predicateCollection.length === 1) {
          this.send('removeAllPropositions', proposition);
        } else {
          predicateCollection.splice(i, 1);
        }
      }

      this.notifyPropertyChange('currentPredicateCollections');

      this.fetchOrganizationsWithCompletePropositions();
    },

    changePropositions(i, proposition) {
      let predicateCollections = this.get('currentPredicateCollections');

      if (predicateCollections.has(proposition.label)) {
        let predicateCollection = predicateCollections.get(proposition.label);
        if (predicateCollection[i]) {
          predicateCollection[i] = proposition;
        } else {
          predicateCollection.push(proposition);
        }
      } else {
        predicateCollections.set(proposition.label, [proposition]);
      }

      this.notifyPropertyChange('currentPredicateCollections');

      this.fetchOrganizationsWithCompletePropositions();
    },

    changePropositionOperator(definitionName, operator) {
      let currentPropositionOperators = this.get('currentPropositionOperators');

      currentPropositionOperators.set(definitionName, operator);

      this.notifyPropertyChange('currentPropositionOperators');

      this.fetchOrganizationsWithCompletePropositions();
    },

    changeCollectionOperator(operator) {
      this.set('currentCollectionOperator', operator);

      this.fetchOrganizationsWithCompletePropositions();
    }
  },

  //Tasks
  fetchOrganizations: task(function * (queryToRun) {
    const router = this.get('router');
    yield timeout(300);

    let results = yield this.get('store').query('organization', queryToRun);
    if (!results.get('length') && this.get('page') !== 1) {
      yield router.transitionTo(router.get('currentRouteName'), [], { page: 1 });
    }
    let totalResults = results.get('meta.total');
    let locale = this.get('locale.userLocale.locale');

    this.set('totalRecords', totalResults);
    this.set('totalResults', new Intl.NumberFormat(locale).format(totalResults));

    return results;
  }).restartable(),

  //Methods
  buildNewCollection(predicateCollection) {
    let currentCollectionOperator = this.get('currentCollectionOperator');
    let currentPropositionOperators = this.get('currentPropositionOperators');
    let propositionCollection = [];
    let page = this.get('page');

    for (let key of predicateCollection.keys()) {
      propositionCollection.push({
        proposition_operator: currentPropositionOperators.get(key),
        propositions: predicateCollection.get(key).map(predicate => {
          return {
            field: predicate.field,
            operator: predicate.operator,
            value: this.getValueForValueType(predicate.value)
          };
        })
      });
    }

    return {
      offset: PAGE_LIMIT * page - PAGE_LIMIT,
      limit: PAGE_LIMIT,
      predicates: {
        collection_operator: currentCollectionOperator,
        collections: propositionCollection
      }
    };
  },

  getValueForValueType(value) {
    if (Array.isArray(value)) {
      return value.mapBy('value').join(',');
    } else if( (typeof value === 'object') && (value !== null) ) {
      return value.value;
    } else {
      return value;
    }
  },

  fetchOrganizationsWithCompletePropositions() {
    let predicateCollections = this.get('currentPredicateCollections');
    let completePredicateCollections = new Map();
    let lastRunQuery = this.get('lastRunQuery');

    predicateCollections.forEach((value, key) => {
      if (value.length) {
        let completedPredicatesInCollection = value.filter(predicate => {
          if (!predicate.value && predicate.value !== false) {
            return false;
          } else {
            return true;
          }
        });

        if (completedPredicatesInCollection.length) {
          completePredicateCollections.set(key, completedPredicatesInCollection);
        }
      }
    });

    let query = this.buildNewCollection(completePredicateCollections);

    if (!lodash.isEqual(query, lastRunQuery)) {
      this.set('lastRunQuery', query);
      this.get('fetchOrganizations').perform(query);
    }
  }
});
