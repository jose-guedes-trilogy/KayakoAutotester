import DS from 'ember-data';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import { findLocaleFieldBySettings } from 'frontend-cp/utils/locale';

let { attr, belongsTo, Model } = DS;

export default Model.extend({
  agent: belongsTo('user', { async: false }),
  articleOrderBy: attr('string'),
  category: belongsTo('category', { async: false }),
  description: attr('string'),
  slug: attr('string'),
  titles: DS.hasMany('locale-field', { async: false }),
  totalArticles: attr('number'),
  visibility: attr('string'),
  createdAt: attr('date'),
  updatedAt: attr('date'),

  locale: service(),
  session: service(),
  titleLocale: computed('titles.[]', 'locale.accountDefaultLocaleCode', 'session.user.locale.locale', function() {
    return findLocaleFieldBySettings(this.get('titles'), this.get('locale'), this.get('session'));
  }),
  title: computed.readOnly('titleLocale.translation')
});
