import ApplicationSerializer from './application';
import _ from 'npm:lodash';

export default ApplicationSerializer.extend({
  primaryKey: 'field',

  extractAttributes(modelClass, resourceHash) {
    resourceHash.values = _.map(resourceHash.values, (val, id) => ({
      value: id,
      string: val
    }));
    return this._super(...arguments);
  }
});
