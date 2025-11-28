import Ember from 'ember';
import ApplicationAdapter from './application';

const inflector = new Ember.Inflector(Ember.Inflector.defaultRules);

export default ApplicationAdapter.extend({
  pathForType() {
    return 'notes';
  },

  urlForQuery(query, modelName) {
    let parent = query.parent;
    if (parent) {
      Reflect.deleteProperty(query, 'parent');
      let id = parent.id;
      let url = this._super(...arguments);
      let pathForType = this.pathForType();
      return url.replace(pathForType, `${inflector.pluralize(parent._internalModel.modelName)}/${id}/${pathForType}`);
    }
    return this._super(...arguments);
  },

  urlForCreateRecord(modelType, snapshot) {
    let pathForType = this.pathForType();
    var url = this._super(...arguments);
    return url.replace(pathForType, `organizations/${snapshot.record.get('organization.id')}/${pathForType}`);
  },

  query(store, type, query) {
    const organization = query.parent;

    return this._super(...arguments).then(payload => {
      payload.data.forEach((entry) => {
        entry.parent = {
          id: organization.get('id'),
          type: 'organization'
        };
      });

      // Need to unload posts for the current organization when we request new organization notes
      // because currently the API gives us notes, and we don't have the same API as in
      // case posts to draw the Profile Timeline. To reuse the current Timeline code
      // we have to push a "post" model. So when we request organization-notes, we
      // actually create a post model and we don't push the organization-note into the store.
      // @see serializers/organization-note
      store.peekAll('post').forEach(post => {
        if (parseInt(organization.get('id')) === parseInt(post.get('original.parent.id'))) {
          store.unloadRecord(post);
        }
      });

      return payload;
    });
  }
});
