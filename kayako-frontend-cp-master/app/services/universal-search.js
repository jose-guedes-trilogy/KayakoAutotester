import Service from '@ember/service';
import { inject as service } from '@ember/service';

export default Service.extend({
  store: service(),

  search(query) {
    return this.get('store').query('search-result', {
      query: query,
      fields: [
        'title',
        'snippet',
        'resource',
        'resource_url',
        'data(' + [
          'role',
          'organization',
          'domains',
          'emails',
          'phones',
          'twitter',
          'facebook',
          'avatar',
          'requester(avatar)',
          'last_message_preview',
          'last_post_status',
          'last_replier(role)',
          'creator(full_name,avatar)',
          'created_at',
          'updated_at',
          'status',
          'helpcenter_url',
          'assigned_agent(avatar,full_name)',
          'assigned_team',
          'source_channel',
          'titles',
          'section(titles,category(titles))'
        ].join(',') + ')'
      ].join(','),
      include: [
        'case',
        'user',
        'user_minimal',
        'status',
        'article',
        'section',
        'category',
        'locale_field',
        'channel',
        'role',
        'organization',
        'identity_email',
        'identity_phone',
        'identity_twitter',
        'identity_facebook',
        'identity_domain'
      ].join(','),
      offset: 0,
      limit: 30
    });
  }

});
