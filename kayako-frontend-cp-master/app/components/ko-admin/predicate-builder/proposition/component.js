import { guidFor } from '@ember/object/internals';
import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed, get } from '@ember/object';
import { dasherize } from '@ember/string';
import EmberObject from '@ember/object';
import _ from 'npm:lodash';
import fallbackIfUndefined from 'frontend-cp/lib/computed-fallback-if-undefined';
import { task, timeout } from 'ember-concurrency';

export default Component.extend({
  tagName: '',

  i18n: service(),
  store: service(),

  canDeleteProposition: false,
  definitions: fallbackIfUndefined([]),
  definitionsSort: ['groupLabel:asc'],
  onPropositionDeletion: null,
  onPropositionChange: null,
  proposition: null,
  uniqueId: null,
  disabled: false,

  init() {
    this._super(...arguments);
    this.uniqueId = guidFor(this);
  },

  definition: computed('definitions.@each.id', 'proposition.field', function() {
    return this.get('definitions').findBy('id', this.get('proposition.field'));
  }),

  /**
   * Used for specific propositions which require different
   * localisation than normal. Can add some more with OR
   * conditions if required.
   */
  isMiscellaneousProposition: computed.equal('proposition.field', 'business_hour'),

  groupedDefinitions: computed('definitions.@each.id', 'definitions.@each.disabled', function () {
    return _.map(
      _.groupBy(this.get('definitions').toArray(), definition => definition.get('group')),
      (options, group) => {
        return {
          groupName: this.get('i18n').t(`admin.predicate_builder.group.${group}`),
          disabled: options.every(o => o.disabled),
          options: options.sort(option => option.label)
        };
      }
    ).sort(group => group.groupBy);
  }),

  definitionInputType: computed('definition.inputType', function() {
    const inputType = this.get('definition.inputType');

    if (inputType === 'BOOLEAN_TRUE' || inputType === 'BOOLEAN_FALSE') {
      this.set('proposition.operator', this.get('definition.operators.firstObject'));
      this.set('proposition.value', true);
    }

    if (inputType) {
      return dasherize(inputType);
    } else {
      return null;
    }
  }),

  dateRelativeValues: computed('definition.values.[]', function() {
    return this.get('definition.values').mapBy('value');
  }),

  value: computed('proposition.value', 'definition.values.@each.value', 'definitionInputType', 'autocompleteType', function() {
    const propositionValue = this.get('proposition.value');

    switch (this.get('definitionInputType')) {
      case 'options': {
        const definitionValues = this.get('definition.values');

        if (definitionValues) {
          return definitionValues.findBy('value', propositionValue);
        } else {
          return null;
        }
      }
      case 'autocomplete': {
        if (propositionValue) {
          const presetValue = this.get('definition.values').findBy('value', propositionValue);
          if (presetValue) {
            return presetValue;
          } else {
            return this.get('store').findRecord(this.get('autocompleteType'), propositionValue);
          }
        } else {
          return null;
        }
      }
      case 'tags': {
        if (propositionValue) {
          return propositionValue.split(',').map((t) => EmberObject.create({ name: t }));
        } else {
          return [];
        }
      }
      case 'multiple': {
        const definitionValues = this.get('definition.values');

        if (propositionValue) {
          return propositionValue.split(',').map((t) => definitionValues.findBy('value', t.trim())); // AI-GEN - Sweep
        } else {
          return [];
        }
      }
      case 'time': {
        if (propositionValue) {
          let trimmed = propositionValue.trim();

          if (/^\d+$/.test(trimmed)) {
            return parseInt(trimmed, 10) / 3600;
          }
        }

        return null;
      }
      default: return propositionValue;
    }
  }),

  autocompleteType: computed('proposition.field', function() {
    switch (this.get('proposition.field')) {
      case 'cases.organizationid':
      case 'users.organizationid':
        return 'organization';
      default:
        return 'user';
    }
  }),

  autocompleteQueryOptions: computed('proposition.field', function() {
    switch (this.get('proposition.field')) {
      case 'cases.assigneeagentid':
      case 'assigneeagentid':
        return { in: 'ADMINS,AGENTS,COLLABORATORS' };
      default:
        return {};
    }
  }),

  autocompleteOptionLabelPath: computed('autocompleteType', function() {
    switch (this.get('autocompleteType')) {
      case 'user':
        return 'fullName';
      default:
        return 'name';
    }
  }),

  multipleRemainingOptions: computed('value', 'definition.values', function() {
    const allOptions = this.get('definition.values').slice();
    return allOptions.removeObjects(this.get('value'));
  }),

  booleanOptions: computed(function() {
    return ['true', 'false'];
  }),

  triggerPropositionChange() {
    if (this.get('onPropositionChange')) {
      return this.get('onPropositionChange')(this.get('proposition'));
    }
  },

  suggestTags: task(function * (term) {
    yield timeout(300);

    let store = this.get('store');
    let value = this.get('value') || [];
    let used = value.mapBy('name');
    let tags = yield store.query('tag', { name: term });
    let result = tags
      .mapBy('name')
      .filter(name => !used.includes(name))
      .map(name => ({ name }));

    return result;
  }).restartable(),

  actions: {
    convertValueToSeconds(value) {
      const trimmed = value.trim();
      let result = '';

      if (/^\d+$/.test(trimmed)) {
        result = (3600 * parseInt(trimmed, 10)) + '';
      }

      this.set('proposition.value', result);
    },

    selectDefinition(definition) {
      this.set('proposition.field', definition.get('id'));
      this.set('proposition.value', null);
      this.set('proposition.operator', null);
      this.triggerPropositionChange();
    },

    selectValue(value) {
      this.set('proposition.value', value.get('value'));
      this.triggerPropositionChange();
    },

    setMultipleValue(newSelection) {
      this.set('proposition.value', newSelection.mapBy('value').join(','));
      this.triggerPropositionChange();
    },

    selectAutocompleteValue(value) {
      this.set('proposition.value', value.get('id') || value.get('value'));
      this.triggerPropositionChange();
    },

    addTagToValue(tag) {
      this.set('proposition.value', this.get('value').mapBy('name').concat(get(tag, 'name')).join(','));
      this.triggerPropositionChange();
    },

    changeOperator(value) {
      this.set('proposition.operator', value);
      this.triggerPropositionChange();
    },

    setValue(value) {
      this.set('proposition.value', value);
      this.triggerPropositionChange();
    },

    removeTagFromValue(tag) {
      this.set('proposition.value', _.without(this.get('value'), tag).mapBy('name').join(','));
      this.triggerPropositionChange();
    },

    searchAutocomplete(text) {
      const autocompleteType = this.get('autocompleteType');

      return this.get('store').query(
        autocompleteType,
        _.extend({}, this.get('autocompleteQueryOptions'), { name: text })
      ).then(results => {
        const matchStr = text.replace(/\W/, '').toLowerCase();
        const matched = this.get('definition.values').filter(definition => {
          return definition.get('string').replace(/\W/, '').toLowerCase().indexOf(matchStr) !== -1;
        });
        return matched.concat(results.toArray());
      });
    }
  }
});
