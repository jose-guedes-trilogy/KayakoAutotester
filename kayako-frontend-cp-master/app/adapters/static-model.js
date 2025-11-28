import DS from 'ember-data';
import _ from 'npm:lodash';
/*
 * Static model adapter
 *
 * Records will never be loaded or persisted the backend
 * Initialize any models in initializers
 * See case-field-type for implementation example
 */

export default DS.Adapter.extend({
  findAll(store, typeClass) {
    return store.peekAll(typeClass);
  },

  find(store, typeClass, id) {
    let records = this.findAll(store, typeClass);

    let matchingRecords = _.select(records, record => {
      return record.id === id;
    });

    if (matchingRecords.length) {
      return matchingRecords.firstObject;
    }
  }
});
