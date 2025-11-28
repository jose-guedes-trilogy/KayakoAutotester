import DS from 'ember-data';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import { findLocaleFieldBySettings } from 'frontend-cp/utils/locale';

let { attr, belongsTo, hasMany, Model } = DS;

export default Model.extend({
  brand: belongsTo('brand', { async: false }),
  description: attr('string'),
  displayOrder: attr('number'),
  titles: hasMany('locale-field', { async: false }),
  slug: attr('string'),
  createdAt: attr('date'),
  updatedAt: attr('date'),

  locale: service(),
  session: service(),
  titleLocale: computed('titles.[]', 'locale.accountDefaultLocaleCode', 'session.user.locale.locale', function () {
    return findLocaleFieldBySettings(this.get('titles'), this.get('locale'), this.get('session'));
  }),
  title: computed.readOnly('titleLocale.translation')
});
