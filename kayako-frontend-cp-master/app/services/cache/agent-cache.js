import Service from '@ember/service';
import { inject as service } from '@ember/service';
import { Promise } from 'rsvp';

const ASSIGNEE_QUERY_DATA = {
  role: 'agent',
  limit: 500,
  fields: 'resource_type,is_enabled,full_name,teams,avatar,locale',
  include: ['team']
};

const MENTIONS_QUERY_DATA = {
  role: 'collaborator',
  limit: 500,
  fields: 'resource_type,is_enabled,full_name,avatar,emails',
  include: ['identity_email']
};

export default Service.extend({
  storeCache: service(),

  getAgents() {
    const storeCache = this.get('storeCache');
    return storeCache.query('user', ASSIGNEE_QUERY_DATA, { ttl: 600000 }); // 10 minutes
  },

  getAgentsForMentions() {
    const storeCache = this.get('storeCache');
    let allUsers = [];
    let offset = 0;
    const limit = MENTIONS_QUERY_DATA.limit;

    return new Promise((resolve) => {
      const fetchPage = () => {
        const queryParams = Object.assign({}, MENTIONS_QUERY_DATA, { offset });

        storeCache.query('user', queryParams, { ttl: 600000 }).then(response => {
          allUsers = allUsers.concat(response.toArray());

          if (!response.meta || !response.meta.total || offset + limit >= response.meta.total) {
            resolve(allUsers);
          } else {
            offset += limit;
            fetchPage();
          }
        });
      };

      fetchPage();
    });
  },

  invalidateCache() {
    this.get('storeCache').invalidateCache('user', ASSIGNEE_QUERY_DATA);
    this.get('storeCache').invalidateCache('user', MENTIONS_QUERY_DATA);
  }
});
