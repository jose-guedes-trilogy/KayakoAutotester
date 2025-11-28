import Component from '@ember/component';
import { inject as service } from '@ember/service';
import _ from 'npm:lodash';

export const INITIAL_FILTER = { key: 'title', operator: 'contains', value: '' };

export default Component.extend({
  // Initialize the component's state
  filters: null,
  filterColumns: ['title', 'section', 'category', 'brand', 'author', 'status', 'updatedAt'],
  filterOperators: ['contains', 'equals', 'startsWith', 'endsWith', 'isEmpty', 'isNotEmpty'],
  isApplying: false,
  initialFilters: [_.clone(INITIAL_FILTER)],
  
  notification: service(),
  i18n: service(),
  session: service(), 

  init() {
    this._super(...arguments);

    if (!this.filters || this.filters.length === 0) {
      this.set('filters', _.cloneDeep(this.get('initialFilters')));
    } else {
      this.set('filters', this.filter);
    }
  },


  clearErrors(index) {
    this.set(`filters.${index}.errors`, undefined);
  },

  actions: {
    // Add a new filter row
    addFilter() {
      let filters = this.get('filters');
      filters.pushObject(_.clone(INITIAL_FILTER));
      this.set('filters', filters);
    },

    // Update the key (column) of a filter
    updateFilterKey(index, value) {
      this.set(`filters.${index}.key`, value);
      this.clearErrors(index);
    },

    // Update the operator of a filter
    updateFilterOperator(index, value) {
      this.set(`filters.${index}.operator`, value);
      this.clearErrors(index);
    },

    // Update the value of a filter
    updateFilterValue(index, event) {
      this.set(`filters.${index}.value`, event.target.value);
      this.clearErrors(index);
    },

    // Remove a filter row, but prevent removing the last one
    removeFilter(index) {
      let filters = this.get('filters');
      
      // Ensure there's always at least one filter row
      if (filters.length > 1) {
        filters.removeAt(index);
        this.set('filters', filters);
      }
    },

    async applyFilters() {
      try {
        this.set('isApplying', true);
        let filters = this.get('filters');

        const errors = [];
  
        // Check if the value is mandatory for specific operators
        for (let index = 0; index < filters.length; index++) {
          let filter = filters[index];
          let filterErrors = {};

          if (['contains', 'startsWith', 'endsWith'].includes(filter.operator) && !filter.value) {
            if (!filterErrors.value) {
              filterErrors.value = [];
            }
            filterErrors.value.push({ message: this.get('i18n').t('admin.knowledgebase.errors.value_required') });
          }

          if (Object.keys(filterErrors).length > 0) {
            errors.push(filterErrors);
            this.set(`filters.${index}.errors`, filterErrors);
          }
        }
  
        if (errors.length > 0) {
          return;
        }
  
        await this.onApply(filters); // Pass filters back to the parent component
      } catch (err) {
        // Handle any unexpected errors
        this.get('notification').error(this.get('i18n').t('generic.generic_error'));
      } finally {
        this.set('isApplying', false);
      }
    },

    // Reset all filters back to the initial filter
    async resetFilters() {
      try {
        this.set('isApplying', true);
        this.set('filters', _.cloneDeep(this.get('initialFilters')));
        await this.onApply(this.get('filters'));
      } catch (err) {
        // Handle any unexpected errors
        this.get('notification').error(this.get('i18n').t('generic.generic_error'));
      } finally {
        this.set('isApplying', false);
      }
    }
  }
});
