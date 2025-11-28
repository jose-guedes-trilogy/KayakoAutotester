import EmberObject from '@ember/object';
import RSVP from 'rsvp';
import { getOwner } from '@ember/application';
import Service, { inject as service } from '@ember/service';
import _ from 'npm:lodash';
import { task } from 'ember-concurrency';

const resultGroups = {
  CASES: {
    fields: 'data(requester(avatar,full_name),last_post_status,last_replier(full_name,role),last_message_preview,subject,priority,state,status,assigned_agent(full_name,avatar),updated_at,last_replied_at,has_attachments),resource',
    include: 'case,case_status,case_priority,user,role'
  },
  USERS: {
    fields: 'data(avatar,full_name,emails,organization(name),last_activity_at),resource',
    include: 'user,identity_email,organization'
  },
  ORGANIZATIONS: {
    fields: '+name,+updated_at,+domains',
    include: 'organization'
  }
};

export default Service.extend({
  store: service(),

  search(term, offset, pageLimit) {
    return this.get('_performSearch').perform(term, offset, pageLimit);
  },

  searchByGroup(query, offset = 0, limit = 30, resources = null, fields = null, include = '*') {
    const adapter = getOwner(this).lookup('adapter:application');
    const url = `${adapter.namespace}/search`;
    const options = {
      data: {
        query,
        offset,
        limit,
        fields,
        include,
        resources
      }
    };
    return adapter.ajax(url, 'GET', options);
  },

  _performSearch: task(function * (term, offset, pageLimit) {
    const promises = Object.keys(resultGroups).map((group) => {
      const { fields, include } = resultGroups[group];
      return this.searchByGroup(term, offset, pageLimit, group, fields, include);
    });

    return yield RSVP.all(promises).then(responses => {
      const results = _.zip(Object.keys(resultGroups), responses.getEach('data'), responses.getEach('total_count'));

      responses.forEach(res => {
        Reflect.deleteProperty(res, 'data');
        this.get('store').pushPayload(res);
      });

      // Turn group we want into models
      const searchResults = EmberObject.create({});

      results.forEach(res => {
        searchResults.set(res[0], {
          results: res[1],
          total: res[2],
          totalPages: Math.ceil(res[2] / pageLimit)
        });
      });

      return searchResults;
    });
  }).drop()
});
