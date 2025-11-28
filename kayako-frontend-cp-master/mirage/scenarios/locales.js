export function defaultLocale(server) {
  let defaultLocale = server.db.locales.find(1);
  return defaultLocale || server.create('locale', {
    id: 1,
    locale: 'en-us'
  });
}
