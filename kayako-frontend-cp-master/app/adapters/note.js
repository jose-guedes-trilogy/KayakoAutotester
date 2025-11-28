import Ember from 'ember';
import ApplicationAdapter from './application';

const inflector = new Ember.Inflector(Ember.Inflector.defaultRules);

export default ApplicationAdapter.extend({
  urlForQuery(query, modelName) {
    if (query.parent) {
      let id = query.parent.get('id');
      let pluralParentType = inflector.pluralize(query.parent.get('resourceType'));
      let url = this._super(...arguments);
      Reflect.deleteProperty(query, 'parent');
      return url.replace('/notes', `/${pluralParentType}/${id}/notes`);
    }
    return this._super(...arguments);
  },

  urlForCreateRecord(modelType, snapshot) {
    let url = this._super(...arguments);
    const type = snapshot.adapterOptions.type;
    const id = snapshot.adapterOptions[type];
    return url.replace('notes', `${type + 's'}/${id}/notes`);
  },

  urlForUpdateRecord(id, modelName, snapshot) {
    let { entityName, entityId } = snapshot.adapterOptions;
    return `${this.namespace}/${entityName}/${entityId}/${modelName}s/${id}`;
  },

  getNoteSource(entity, entityId, noteId, limit = 15) {
    let type;
    if (entity === 'cases') {
      type = 'posts';
    }
    else {
      type = 'activities';
    }
    let url = `${this.namespace}/${entity}/${entityId}/${type}?resource_type=note&id=${noteId}&limit=${limit}`;
    return this.ajax(url, 'GET');
  }
});
