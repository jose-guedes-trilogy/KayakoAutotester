import { filterBy } from '@ember/object/computed';
import $ from 'jquery';
import { A } from '@ember/array';
import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import { task } from 'ember-concurrency';
import { getOwner } from '@ember/application';

export default Component.extend({
  notifications: service('notification'),
  i18n: service(),
  store: service(),
  confirmation: service(),
  cookies: service(),

  pages: null,
  availablePages: null,
  saveInProgress: false,
  showModal: false,

  onPagesAdded() {},

  // Lifecycle hooks
  init() {
    this._super(...arguments);

    let pages = this.get('pages');

    if (!pages) {
      this.set('pages', A());
    }
  },

  didReceiveAttrs() {
    let showModal = this.get('showModal');

    if (showModal) {
      this.get('fetchAvailablePages').perform();
    }
  },

  // CPs
  enabledPages: filterBy('pages', 'isEnabled', true),
  disabledPages: filterBy('pages', 'isEnabled', false),
  submitDisabled: computed('availablePages.@each.import', function() {
    return (this.get('availablePages') || [])
        .filter(page => !!page.get('import'))
        .length <= 0;
  }),

  // Tasks
  fetchAvailablePages: task(function * () {
    yield this.get('store').query('facebook-page', { state: 'AVAILABLE' }).then((pages) => {
      this.set('availablePages', pages);
    });
  }).drop(),

  // Actions
  actions: {
    redirectToFacebookAuthenticationEndpoint(isPageReconnect, e) {
      e.stopPropagation();

      let store = this.get('store');

      store.queryRecord('oauth-link', { callback: '/admin/channels/facebook/callback' }).then(link => {
        this.get('cookies').write('is_facebook_page_reconnect', isPageReconnect, {
          maxAge: 300,
          path: '/admin/channels'
        });
        window.location.href = link.get('id');
      });
    },

    toggleEnabled(page, e) {
      e.stopPropagation();
      page.toggleProperty('isEnabled');
      page.save().then(() => {
        const notificationMessage = this.get('i18n').t(
          page.get('isEnabled') ? 'admin.facebook.enabled.message' : 'admin.facebook.disabled.message'
        );
        this.get('notifications').success(notificationMessage);
      });
    },

    deletePage(page, e) {
      e.stopPropagation();
      this.get('confirmation')
        .confirm({ intlConfirmationBody: 'generic.confirm.delete' })
        .then(() => {
          page.destroyRecord().then(() => {
            this.get('notifications').success(this.get('i18n').t('admin.facebook.deleted.message'));
          });
        });
    },

    editPage(page, event) {
      if (event && $(event.target).closest('a').length) {
        return;
      }

      this.get('on-edit')(page);
    },

    importPages() {
      const adapter = getOwner(this).lookup('adapter:application');
      const url = `${adapter.namespace}/facebook/pages`;

      this.set('saveInProgress', true);

      adapter.ajax(url, 'POST', {
        data: {
          page_ids: this.get('availablePages').filterBy('import', true).map(page => page.get('id')).join(',')
        }
      }).then((pagesPayload) => {
        this.get('store').pushPayload(pagesPayload);

        let pages = pagesPayload.facebook_pages.map((page) => {
          return this.get('store').peekRecord('facebook-page', page.id)._internalModel;
        });

        this.get('pages').addObjects(pages);

        this.set('saveInProgress', false);

        this.attrs.onPagesAdded();
      }, () => {
        this.set('saveInProgress', false);
      });
    }
  }
});
