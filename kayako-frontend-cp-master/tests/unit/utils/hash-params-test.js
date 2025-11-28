import { getImpersonationHash, removeImpersonationHash } from 'frontend-cp/utils/hash-params';
import { module, test } from 'qunit';

module('Unit | Utility | hash-params');

test('getImpersonationHash works on basic case', function(assert) {
  const windowHash = '#impersonationToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE1MDk1MTc3MzAsImV4cCI6MTU0MTA1MzczMCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoianJvY2tldEBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6IkpvaG5ueSIsIlN1cm5hbWUiOiJSb2NrZXQiLCJFbWFpbCI6Impyb2NrZXRAZXhhbXBsZS5jb20iLCJSb2xlIjpbIk1hbmFnZXIiLCJQcm9qZWN0IEFkbWluaXN0cmF0b3IiXX0.CqgJ7tuLlQlPvBKz7deGpz2S9lDJAZqm95MvyUr7aCM';
  const actual = getImpersonationHash(windowHash);
  const expected = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE1MDk1MTc3MzAsImV4cCI6MTU0MTA1MzczMCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoianJvY2tldEBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6IkpvaG5ueSIsIlN1cm5hbWUiOiJSb2NrZXQiLCJFbWFpbCI6Impyb2NrZXRAZXhhbXBsZS5jb20iLCJSb2xlIjpbIk1hbmFnZXIiLCJQcm9qZWN0IEFkbWluaXN0cmF0b3IiXX0.CqgJ7tuLlQlPvBKz7deGpz2S9lDJAZqm95MvyUr7aCM';

  assert.equal(actual, expected);
});

test('getImpersonationHash works when there are multiple hashparams', function(assert) {
  const expected = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE1MDk1MTc3MzAsImV4cCI6MTU0MTA1MzczMCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoianJvY2tldEBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6IkpvaG5ueSIsIlN1cm5hbWUiOiJSb2NrZXQiLCJFbWFpbCI6Impyb2NrZXRAZXhhbXBsZS5jb20iLCJSb2xlIjpbIk1hbmFnZXIiLCJQcm9qZWN0IEFkbWluaXN0cmF0b3IiXX0.CqgJ7tuLlQlPvBKz7deGpz2S9lDJAZqm95MvyUr7aCM';
  const windowHashs = [
    `#abc&impersonationToken=${expected}`,
    `#abc=def&impersonationToken=${expected}`,
    `#impersonationToken=${expected}&abc`,
    `#impersonationToken=${expected}&abc=def`,
    `#param1&param=value&impersonationToken=${expected}&crap`,
  ];

  for (let hash of windowHashs) {
    assert.equal(getImpersonationHash(hash), expected);
  }
});


test('removeImpersonationHash works on basic case', function(assert) {
  const windowHash = '#impersonationToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE1MDk1MTc3MzAsImV4cCI6MTU0MTA1MzczMCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoianJvY2tldEBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6IkpvaG5ueSIsIlN1cm5hbWUiOiJSb2NrZXQiLCJFbWFpbCI6Impyb2NrZXRAZXhhbXBsZS5jb20iLCJSb2xlIjpbIk1hbmFnZXIiLCJQcm9qZWN0IEFkbWluaXN0cmF0b3IiXX0.CqgJ7tuLlQlPvBKz7deGpz2S9lDJAZqm95MvyUr7aCM';
  const actual = removeImpersonationHash(windowHash);
  const expected = '';

  assert.equal(actual, expected);
});

test('removeImpersonationHash works on basic case', function(assert) {
  const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE1MDk1MTc3MzAsImV4cCI6MTU0MTA1MzczMCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoianJvY2tldEBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6IkpvaG5ueSIsIlN1cm5hbWUiOiJSb2NrZXQiLCJFbWFpbCI6Impyb2NrZXRAZXhhbXBsZS5jb20iLCJSb2xlIjpbIk1hbmFnZXIiLCJQcm9qZWN0IEFkbWluaXN0cmF0b3IiXX0.CqgJ7tuLlQlPvBKz7deGpz2S9lDJAZqm95MvyUr7aCM';
  const windowHashs = [
    {'inp': `#abc&impersonationToken=${token}`, 'out': '#abc'},
    {'inp': `#abc=def&impersonationToken=${token}`, 'out': '#abc=def'},
    {'inp': `#impersonationToken=${token}&abc`, 'out': '#abc'},
    {'inp': `#impersonationToken=${token}&abc=def`, 'out': '#abc=def'},
    {'inp': `#param1&param=value&impersonationToken=${token}&crap`, 'out': '#param1&param=value&crap'},
  ];

  for (let {inp, out} of windowHashs) {
    assert.equal(removeImpersonationHash(inp), out);
  }
});
