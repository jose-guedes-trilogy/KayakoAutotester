import Service, { inject as service } from '@ember/service';

export default Service.extend({
  store: service('store'),

  getTagByName(tagName) {
    let tag = this.get('store').peekAll('tag').find(tag => tag.get('name') === tagName);
    return tag ? tag : this.get('store').createRecord('tag', {name: tagName});
  }
});
