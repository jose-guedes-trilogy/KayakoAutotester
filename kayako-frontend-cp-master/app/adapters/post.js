import Ember from 'ember';
import ApplicationAdapter from './application';

const inflector = new Ember.Inflector(Ember.Inflector.defaultRules);

const REQUIRED_SIDELOADED_MODELS = 'attachment,case_message,channel,post,user,identity_phone,identity_email,identity_twitter,identity_facebook,note,activity,chat_message,facebook_message,twitter_tweet,twitter_message,comment,event,action,trigger,monitor,engagement,sla_version,activity_object,rating,case_status,activity_actor';


export default ApplicationAdapter.extend({
  urlForQuery(query, modelName) {
    if (query.parent) {
      let id = query.parent.id;
      let url = this._super(...arguments);
      let type = query.parent.get('constructor.modelName');
      Reflect.deleteProperty(query, 'parent');
      return url.replace('/posts', `/${inflector.pluralize(type)}/${id}/posts?include=${REQUIRED_SIDELOADED_MODELS}`);
    }
    return this._super(...arguments);
  },

  urlForFindRecord(id, modelName, snapshot) {
    let parent = snapshot.belongsTo('parent');
    let sup = this._super(...arguments);
    if (parent) {
      return sup.replace('posts', `${inflector.pluralize(parent.type.modelName)}/${parent.id}/posts`);
    } else {
      return sup.replace('posts', 'cases/posts');
    }
  },

  markAsSeen(post) {
    let id = post.get('id');
    let namespace = this.namespace;
    let options = { data: { post_status: 'SEEN' } };

    return this.ajax(`${namespace}/cases/posts/${id}`, 'PUT', options);
  }
});
