import Service from '@ember/service';
import Evented from '@ember/object/evented';

export default Service.extend(Evented, {
  visible: null,

  currentPath() {
    return window.location.pathname;
  },

  open(url, windowName = '', windowFeatures = {}) {
    windowFeatures = Object.keys(windowFeatures).map(key => `${key}=${windowFeatures[key]}`).join(',');

    window.open(url, windowName, windowFeatures);
  },

  init() {
    this._super(...arguments);

    this.set('visible', document.hasFocus());

    if (!Ember.testing) {
      this._bindWindowEvents();
    }
  },

  willDestroy() {
    this._super(...arguments);

    this._unbindWindowEvents();
  },

  _bindWindowEvents() {
    this._onBlur = () => {
      this.set('visible', false);
      this.trigger('blur');
    };

    this._onFocus = () => {
      this.set('visible', true);
      this.trigger('focus');
    };

    window.addEventListener('blur', this._onBlur, false);
    window.addEventListener('focus', this._onFocus, false);
  },

  _unbindWindowEvents() {
    window.removeEventListener('blur', this._onBlur, false);
    window.removeEventListener('focus', this._onFocus, false);

    this.setProperties({
      _onBlur: null,
      _onFocus: null
    });
  }
});
