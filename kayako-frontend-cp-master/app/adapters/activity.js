import Ember from 'ember';
import ApplicationAdapter from './application';

const inflector = new Ember.Inflector(Ember.Inflector.defaultRules);

export default ApplicationAdapter.extend({
  urlForQuery(query, modelName) {
    if (query.parent) {
      let id = query.parent.id;
      let pluralParentType = inflector.pluralize(query.parent.constructor.modelName);
      let url = this._super(...arguments);
      Reflect.deleteProperty(query, 'parent');
      return url.replace('/activities', `/${pluralParentType}/${id}/activities`);
    }
    return this._super(...arguments);
  }
});
