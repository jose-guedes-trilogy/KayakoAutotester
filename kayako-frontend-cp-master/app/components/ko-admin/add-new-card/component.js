import $ from 'jquery';
import { observer, computed } from '@ember/object';
import Component from '@ember/component';
import { getOwner } from '@ember/application';
import { inject as service } from '@ember/service';
import ENV from 'frontend-cp/config/environment';
import { getMetaData } from 'frontend-cp/utils/bugsnag';
import { task, timeout } from 'ember-concurrency';

export default Component.extend({
  // Attributes
  show: false,
  style: 'modal', // can be inline

  // State
  iframeLoaded: false,
  generatingToken: false,
  reloadingIframe: false,
  iframeLoadFailed: false,

  // Observers
  whenShowChanged: observer('show', function () {
    if (this.get('show')) {
      this.get('trackIframeLoading').cancelAll();
      this.resetState();
      this.renderZuoraForm();
    }
  }),

  // Services
  notificationService: service('notification'),
  i18n: service(),
  plansService: service('plan'),
  launchDarkly: service(),

  // LifeCycle Hooks
  init () {
    this._super(...arguments);
    this.registerPaymentEventListener();
    if (this.get('show')) {
      this.renderZuoraForm();
    }
  },

  willDestroyElement () {
    this._super(...arguments);
    this.removePaymentEventListener();
  },

  // Methods
  registerPaymentEventListener () {
    this._onIframePostMessage = this.onIframePostMessage.bind(this);
    if (!window.addEventListener) {
      window.attachEvent('onmessage', this._onIframePostMessage);
    } else {
      window.addEventListener('message', this._onIframePostMessage, false);
    }
  },

  removePaymentEventListener () {
    if (!window.removeEventListener) {
      window.detachEvent('onmessage', this._onIframePostMessage);
    } else {
      window.removeEventListener('message', this._onIframePostMessage, false);
    }
  },

  resetState() {
    this.set('iframeLoaded', false);
    this.set('reloadingIframe', false);
    this.set('iframeLoadFailed', false);
    // We don't need to reset token as one time getting is enough
  },

  iframeReloadTime: computed('launchDarkly.app-version-notification-frequency', function() {
    const defaultIframeReloadTime = 10000;
    return this.get('launchDarkly.zoura-reloading-time') || defaultIframeReloadTime;
  }),

  trackIframeLoading: task(function * () {
    yield timeout(this.get('iframeReloadTime'));
    
    const context = getMetaData(null, getOwner(this));
    
    // if iframe didn't load in 5 seconds try to reload
    if(!this.get('reloadingIframe')){
      window.Bugsnag.notifyException(new Error('Reloading Iframe for Zoura payment form'), 'Reloading Iframe for Zoura payment form', context, 'info');
      this.set('reloadingIframe', true);
      this.renderZuoraForm();
      return;
    }
    
    this.set('iframeLoadFailed', true);
    window.Bugsnag.notifyException(new Error('Iframe load failed for Zoura payment form'), 'Iframe load failed for Zoura payment form', context, 'error');
  }).drop(),

  injectIFrame (params) {
    this.set('generatingToken', false);
    const queryString = $.param(params);
    this.set('iframeSrc', `${ENV.zuoraSandboxUrl}?${queryString}`);
    
    //start tracking time to load Zuora Iframe
    this.get('trackIframeLoading').perform();
  },

  generateToken () {
    this.set('generatingToken', true);
    const adapter = getOwner(this).lookup('adapter:application');
    return adapter.ajax(`${adapter.namespace}/account/creditcards/token`, 'POST');
  },

  abortNewCardTransaction () {
    this.sendAction('onCancel');
    this.get('notificationService').error(this.get('i18n').t('account.billing.zuora.renderError'));
  },

  onPaymentSuccess (params) {
    this.sendAction('cardAdded', params);
  },

  onPaymentFailure (response) {
    const body = response.errorMessage && decodeURIComponent(response.errorMessage);
    this.get('notificationService').error(this.get('i18n').t('account.billing.card.notAdded'), { body });
    this.renderZuoraForm();
  },

  resizeIframe (params) {
    const paymentIframe = document.getElementById('billing-iframe');
    paymentIframe.width = params.width;
    paymentIframe.height = params.height;
  },

  renderZuoraForm () {
    this
      .generateToken()
      .then((response) => {
        const body = response.data;
        const params = {
          tenantId: body.tenant_id,
          hostedPageId: this.get('plansService.billing.hosted_page_id'),
          signature: body.signature,
          token: body.token,
          key: body.key,
          hostedPageUrl: this.get('plansService.billing.hosted_page_url'),
          paymentGateway: this.get('plansService.billing.payment_gateway')
        };
        this.injectIFrame(params);
      });
  },

  onIframePostMessage (message) {
    if (ENV.zuoraSandboxUrl.indexOf(message.origin) <= -1 || !message.data || !message.data.type) {
      return;
    }

    switch (message.data.type) {
      case 'rendered':
        this.set('iframeLoaded', true);
        this.get('trackIframeLoading').cancelAll();
        break;
      case 'resize':
        this.resizeIframe(message.data.data);
        break;
      case 'error':
        this.abortNewCardTransaction();
        break;
      case 'paymentSuccess':
        this.onPaymentSuccess(message.data.data);
        break;
      case 'paymentFailure':
        this.onPaymentFailure(message.data.data);
        break;
    }
  },

  actions: {
    saveNewCard () {
      var paymentIframe = document.getElementById('billing-iframe').contentWindow;
      paymentIframe.postMessage({type: 'submit'}, ENV.zuoraSandboxUrl);
    }
  }
});
