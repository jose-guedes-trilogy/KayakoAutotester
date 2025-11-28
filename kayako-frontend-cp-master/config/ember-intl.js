module.exports = function(environment) {
  return {
    /**
    * The locales that are application supports.
    *
    * This is optional and is automatically set if project stores translations
    * where ember-intl is able to look them up (<project root>/translations/).
    *
    * If the project relies on side-loading translations, then you must explicitly
    * list out the locales. i.e: ['en-us', 'en-gb', 'fr-fr']
    *
    * @property locales
    * @type {Array?}
    * @default "null"
    */
    locales: ['en-us', 'en-gb']
  };
};
