import { computed } from '@ember/object';
import Service, { inject as service } from '@ember/service';

export default Service.extend({
  types: computed(function() {
    return [
      {
        name: 'EMAIL',
        titleKey: 'admin.apps.endpoints.types.email.title',
        descriptionKey: 'admin.apps.endpoints.types.email.description'
      },
      {
        name: 'SLACK',
        titleKey: 'admin.apps.endpoints.types.slack.title',
        descriptionKey: 'admin.apps.endpoints.types.slack.description'
      },
      {
        name: 'HTTP',
        titleKey: 'admin.apps.endpoints.types.webhook.title',
        descriptionKey: 'admin.apps.endpoints.types.webhook.description'
      }
    ];
  }),

  i18n: service(),

  getTitleBreadcrumbs(model) {
    let title = [];
    const type = this.getTypeByName(model.get('fieldType'));
    const stateModifier = model.get('isNew') ? 'new' : 'edit';

    title.push(this._t('admin.apps.endpoints.title'));

    if (model.get('title')) {
      title.push(model.get('title'));
    } else {
      title.push(this._t(type.titleKey));
      title.push(this._t('admin.apps.endpoints.headings.' + stateModifier));
    }

    return title.join(' / ');
  },

  _t(key) {
    return this.get('i18n').t(key);
  },

  getTypeByName(name) {
    let matched = this.get('types').filter(record => {
      return record.name === name;
    });

    return matched.length ? matched[0] : {};
  }
});
