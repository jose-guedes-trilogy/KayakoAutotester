export function getBasePath() {
  let path = '/agent';
  const pathname = location.pathname;

  // If we are at a deeplink inside admin, redirect back to admin
  // If we have errored at '/admin' leave path='/agent'
  if (pathname.startsWith('/admin') && pathname !== '/admin') {
    path = '/admin';
  }
  // If we're coming from a login path just redirect the user back there.
  // Without this a user could end up in a redirect loop
  if (pathname.endsWith('/login')) {
    path = pathname;
  }
  return path;
}
