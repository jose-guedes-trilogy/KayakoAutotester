import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import { later, cancel } from '@ember/runloop';
import RSVP from 'rsvp';
import config from 'frontend-cp/config/environment';
import styles from './styles';

const ALERT_TYPE_INFO = 'info';
const ALERT_TYPE_WARNING = 'warning';
const ALERT_TYPE_ERROR = 'error';
const ALERT_TYPE_SUCCESS = 'success';

const AUTODISMISS_TIMEOUT = 3000;

export default Component.extend({
  //Attributes
  type: null,
  dismissable: false,
  autodismiss: false,
  isClosing: false,
  href: null,
  hrefText: null,
  hrefTarget: '_blank',
  linkToRoute: null,
  linkToText: null,

  // HTML
  localClassNames: 'toast',

  // Services
  i18n: service(),

  // Private properties
  _animateOutToken: null,

  // CPs
  linkText: computed('hrefText', function() {
    let customText = this.get('hrefText');
    return customText || this.get('i18n').t('generic.find_out_more');
  }),

  iconClass: computed('type', function() {
    switch (this.get('type')) {
      case ALERT_TYPE_INFO: return 'i-info';
      case ALERT_TYPE_WARNING: return 'i-caution-solid';
      case ALERT_TYPE_ERROR: return 'i-danger-solid';
      case ALERT_TYPE_SUCCESS: return 'i-tick';
      default: return null;
    }
  }),

  typeClass: computed('type', function() {
    return styles[this.get('type')];
  }),

  willInsertElement() {
    this._super(...arguments);
    this.animateIn();
    this.initAutoDismiss();
  },

  willDestroyElement() {
    this._super(...arguments);

    if (this._animateOutToken) {
      cancel(this._animateOutToken);
    }
  },

  initAutoDismiss() {
    // always leave toasts in when testing so we can check they appear
    // otherwise we get intermittent failures if we check for a toast
    // but it has been removed in the meantime
    if (config.environment === 'test') {
      return;
    }

    if (!this.get('autodismiss')) {
      return;
    }

    this._animateOutToken = later(this, 'animateOut', AUTODISMISS_TIMEOUT);
  },

  click() {
    if (this.get('autodismiss')) {
      this.animateOut();
    }
  },

  animateIn() {
    animate(this.$(), styles.addModifier, styles.addModifierActive);
  },

  animateOut() {
    if (this.get('isClosing')) {
      return;
    }

    this.set('isClosing', true);

    let $componentElement = this.$();
    let componentHeight = $componentElement.outerHeight();
    animate($componentElement, styles.removeModifier, styles.removeModifierActive, {
      clamp: true
    })
      .then(() => {
        $componentElement.hide();
        this.sendAction('close');
      });
    $componentElement.css('margin-bottom', -componentHeight + 'px');
  },

  actions: {
    onCloseClicked() {
      this.animateOut();
    }
  }
});

function animate($element, className, classNameActive, {
  clamp = false
} = {}) {
  return new RSVP.Promise(resolve => {
    $element.addClass(className);
    forceRender($element);
    $element.one('transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd', function() {
      if (!clamp) {
        $element.removeClass(className + ' ' + classNameActive);
      }
      resolve();
    });
    $element.addClass(classNameActive);
  });

  function forceRender($element) {
    $element.outerHeight();
    return $element;
  }
}
