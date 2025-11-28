import { inject as service } from '@ember/service';
import { filterBy, empty } from '@ember/object/computed';
import Component from '@ember/component';
import { computed } from '@ember/object';
import { getOwner } from '@ember/application';
import { task, timeout } from 'ember-concurrency';

const DOMAIN_AVAILABLE = 'domain-available';
const DOMAIN_NOT_AVAILABLE = 'domain-not-available';

export default Component.extend({
  tagName: '',

  // Attributes
  schema: null,
  brand: null,
  editedBrand: null,
  locales: [],
  tabs: null,

  onCancel: null,
  onSuccess: null,
  onError: null,

  // State
  settingSsl: false,

  // Services
  store: service(),
  virtualModel: service(),
  i18n: service(),

  didReceiveAttrs() {
    let brand = this.get('brand');

    if (brand.get('isSslEnabled')) {
      this.get('getSslCertificate').perform(brand);
    }
  },

  getSslCertificate: task(function * (brand) {
    let payload = yield this.get('store').adapterFor('brand').getSslCertificates(brand);
    let cert = payload.data.certificate;

    this.get('brand').set('sslCertificate', cert);
    this.get('editedBrand').set('sslCertificate', cert);
  }).restartable(),

  // CPs
  enabledLocales: filterBy('locales', 'isPublic', true),

  isValid: computed('brand.isNew', 'checkDomainAvailability.last.value.status', function () {
    return !this.get('brand.isNew') || this.get('checkDomainAvailability.last.value.status') === DOMAIN_AVAILABLE;
  }),

  isAliasEmpty: empty('editedBrand.alias'),

  checkDomainAvailability: task(function * (e) {
    let i18n = this.get('i18n');
    let subDomain = e.target.value;

    if (!subDomain) {
      return null;
    }

    if (subDomain.length < 3) {
      return {
        status: DOMAIN_NOT_AVAILABLE,
        message: i18n.t('admin.brands.edit.domain.too_short')
      };
    }

    if (!/^\w[\w-]*\w$/.test(subDomain)) {
      return {
        status: DOMAIN_NOT_AVAILABLE,
        message: i18n.t('admin.brands.edit.domain.invalid_characters')
      };
    }

    this.set('editedBrand.subDomain', subDomain);

    yield timeout(250);

    const adapter = getOwner(this).lookup('adapter:domain-availability');

    const request = adapter.ajax(`${adapter.namespace}/brands/available`, 'POST', {
      data: {
        sub_domain: subDomain
      }
    });

    try {
      yield request;

      return {
        status: DOMAIN_AVAILABLE,
        message: i18n.t('admin.brands.edit.domain.available')
      };
    } catch (error) {
      return {
        status: DOMAIN_NOT_AVAILABLE,
        message: i18n.t('admin.brands.edit.domain.not_available')
      };
    }
  }).restartable(),

  checkAliasValidity: task(function * (e) {
    const adapter = getOwner(this).lookup('adapter:application');
    const subDomain = this.get('editedBrand.subDomain');
    const alias = this.get('editedBrand.alias');

    const request = adapter.ajax(`${adapter.namespace}/brands/validate`, 'POST', {
      data: {
        sub_domain: subDomain,
        alias: alias
      }
    });
    try {
      yield request;
      return {
        alias,
        status: 'valid'
      };
    } catch (error) {
      return {
        alias,
        status: 'invalid'
      };
    }
  }),

  actions: {
    save() {
      const virtualModel = this.get('virtualModel');
      const schema = this.get('schema');
      const brand = this.get('brand');
      const editedBrand = this.get('editedBrand');
      return virtualModel.save(brand, editedBrand, schema);
    },

    startSettingSsl() {
      this.set('settingSsl', true);
    },

    stopSettingSsl() {
      this.set('editedBrand.sslCertificate', this.get('brand.sslCertificate'));
      this.set('editedBrand.privateKey', '');
      this.set('settingSsl', false);
    }
  }
});
