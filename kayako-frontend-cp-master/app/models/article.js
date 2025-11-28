import DS from 'ember-data';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import { findLocaleFieldBySettings } from 'frontend-cp/utils/locale';

let { attr, hasMany, belongsTo, Model } = DS;

export default Model.extend({
  allowComments: attr('boolean'),
  isFeatured: attr('boolean'),
  attachments: hasMany('attachment', { async: false }),
  author: belongsTo('user-minimal', { async: false }),
  creator: belongsTo('user-minimal', { async: false }),
  contents: attr('string'),
  downloadAll: attr('string'),
  keywords: attr('string'),
  slug: attr('string'),
  status: attr('string'),
  helpcenterUrl: attr('string'),
  titles: hasMany('locale-field', { async: false }),
  rank: attr('number'),
  rating: attr('number'),
  views: attr('number'),
  totalComments: attr('number'),
  tags: hasMany('tag', { async: true }),
  section: belongsTo('section', { async: false }),
  createdAt: attr('date'),
  updatedAt: attr('date'),
  uuid: attr('string'),

  locale: service(),
  session: service(),
  titleLocale: computed('titles.[]', 'locale.accountDefaultLocaleCode', 'session.user.locale.locale', function () {
    return findLocaleFieldBySettings(this.get('titles'), this.get('locale'), this.get('session'));
  }),
  title: computed.readOnly('titleLocale.translation')
});
