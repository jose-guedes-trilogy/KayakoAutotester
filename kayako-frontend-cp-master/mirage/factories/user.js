import { Factory, faker } from 'ember-cli-mirage';

export default Factory.extend({
  full_name: () => `${faker.name.firstName()} Murray`,
  designation: null,
  is_enabled: true,
  role: null, // Note: This is a mandatory field fo being able to log in with a user
  // avatar: 'http://novo/index.php?/avatar/get/5dadfafe-ef84-5db9-91f5-d617d0f4e58b',
  avatar: 'http://fillmurray.com/100/100',
  teams: () => [],
  emails: () => [],
  phones: () => [],
  twitter: () => [],
  facebook: () => [],
  external_identifiers: () => [],
  custom_fields: () => [],
  pinned_notes_count: 0,
  followers: [],
  locale: null,
  organization: null,
  organization_case_access: null,
  time_zone: null,
  time_zone_offset: null,
  greeting: null,
  signature: null,
  status_message: null,
  access_level: null,
  password_updated_at: '2015-07-23T12:09:20Z',
  avatar_updated_at: null,
  last_activity_at: '2015-07-23T16:32:01Z',
  visited_at: '2015-07-23T16:32:01Z',
  created_at: '2015-07-23T12:09:20Z',
  updated_at: '2015-07-23T16:32:01Z',
  resource_type: 'user',
  resource_url: null,

  afterCreate(record, server) {
    server.db.users.update(record.id, {
      resource_url: '/api/v1/users/' + record.id
    });
  }
});
