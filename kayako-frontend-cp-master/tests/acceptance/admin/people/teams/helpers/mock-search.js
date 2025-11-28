/**
 *  Installs a simplified search handler at `/api/v1/search` specialised for
 *  our team management tests.
 *
 *  The handler takes a search term of the form `"alice" in:users role:agent`,
 *  extracts the `alice` bit, and returns users whose `full_name` contains
 *  that string.
 *
 *  @function
 */
export default function mockSearch() {
  server.get('/api/v1/search', handler);
}

function handler({ db: { users } }, { queryParams: { query } }) {
  let [, name] = query.match(/"([^"]+)"/);
  let regex = new RegExp(name, 'i');
  let matches = users.filter(user => regex.test(user.full_name));
  let results = matches.map(user => ({
    id: user.id,
    title: user.full_name,
    snippet: user.full_name,
    resource: 'user',
    resource_url: user.resource_url,
    data: user
  }));

  return {
    status: 200,
    resource: 'result',
    data: results
  };
}
