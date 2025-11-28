export function findLocaleFieldBySettings(localeFields, localeService, sessionService) {
  const fieldInUserLocale = localeFields.findBy('locale', sessionService.get('user.locale.locale'));
  const fieldInAccDefaultLocale = localeFields.findBy('locale', localeService.get('accountDefaultLocaleCode'));
  return fieldInUserLocale || fieldInAccDefaultLocale;
}
