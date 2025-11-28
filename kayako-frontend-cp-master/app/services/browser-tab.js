import Service from '@ember/service';
import { inject as service } from '@ember/service';

import { task, timeout } from 'ember-concurrency';

const FAVICON_WIDTH_HEIGHT = 32;
const FAVICON_PATH = '/images/favicon32x32.png';
const NOTIFICATION_CIRCLE_FILL_COLOUR = '#DB3F24';
const NOTIFICATION_CIRCLE_BORDER_COLOUR = '#FFFFFF';

export default Service.extend({
  _faviconKeyframes: null,
  _defaultFavicons: null,
  _windowFocusEventBound: false,

  window: service(),
  headData: service(),
  i18n: service(),

  init() {
    this._super(...arguments);

    this._faviconKeyframes = [];
    this._defaultFavicons = {};
  },

  initialize() {
    this._saveDefaultFavicons();
    this._preGenerateFavicons();
  },

  _saveDefaultFavicons() {
    let favicons = this._favicons();

    let defaults = favicons.reduce((defaults, icon) => {
      defaults[icon.getAttribute('sizes')] = icon.getAttribute('href');
      return defaults;
    }, {});

    this._defaultFavicons = defaults;
  },

  registerAppUpdate() {
    if (!this._isWindowVisible()) {
      this._updateFavicon();
      this._updateTitle();
      this._bindWindowFocusEvent();
    }
  },

  _preGenerateFavicons() {
    let context = this._canvasContext();

    let img = document.createElement('img');
    img.setAttribute('crossOrigin', 'anonymous');

    let _this = this;
    img.onload = function() {
      let img = this;
      _this._generateFaviconKeyframes(img, context);
    };

    img.src = FAVICON_PATH;
  },

  _generateFaviconKeyframes(img, context) {
    let keyframes = this._alphaValues().map(alpha => {
      context.globalAlpha = alpha;

      this._drawBackgroundImage(img, context);
      this._drawNotificationCircle(context);

      return this._dataUrl(context);
    });

    this._faviconKeyframes = keyframes;
  },

  _alphaValues() {
    function generateAlphaValue(val) {
      return (val + 1) / 10;
    }

    return [...Array(10).keys()].map(generateAlphaValue);
  },

  _drawBackgroundImage(img, context) {
    context.clearRect(0, 0, FAVICON_WIDTH_HEIGHT, FAVICON_WIDTH_HEIGHT);
    context.drawImage(img, 0, 0, FAVICON_WIDTH_HEIGHT, FAVICON_WIDTH_HEIGHT);
  },

  _drawNotificationCircle(context) {
    let [outer, inner] = this._circleProperties();

    context.beginPath();
    context.arc(outer.x, outer.y, outer.radius, outer.startAngle, outer.endAngle);
    context.fillStyle = outer.colour;
    context.fill();

    context.beginPath();
    context.arc(inner.x, inner.y, inner.radius, inner.startAngle, inner.endAngle);
    context.fillStyle = inner.colour;
    context.fill();
  },

  _circleProperties() {
    let outerCircle = {
      x: FAVICON_WIDTH_HEIGHT * 0.75,
      y: FAVICON_WIDTH_HEIGHT / 2,
      radius: FAVICON_WIDTH_HEIGHT / 4,
      startAngle: 0,
      endAngle: 2 * Math.PI,
      colour: NOTIFICATION_CIRCLE_BORDER_COLOUR
    };

    let innerCircle = Object.assign({}, outerCircle, {
      radius: outerCircle.radius * 0.75,
      colour: NOTIFICATION_CIRCLE_FILL_COLOUR
    });

    return [outerCircle, innerCircle];
  },

  _isWindowVisible() {
    return this.get('window.visible');
  },

  _updateFavicon() {
    this.get('_applyFaviconKeyframes').perform();
  },

  _restoreFavicon() {
    this._favicons().forEach(icon => icon.href = this._defaultFavicons[icon.getAttribute('sizes')]);
  },

  _applyFaviconKeyframes: task(function * () {
    let favicons = this._favicons();

    for(let frame of this._faviconKeyframes) {
      favicons.forEach(icon => icon.href = frame);
      yield timeout(100);
    }
  }).drop(),

  _updateTitle() {
    this.get('_applyTitle').perform();
  },

  _restoreTitle() {
    this.get('_applyTitle').cancelAll();
  },

  _applyTitle: task(function * () {
    let originalTitle = this.get('headData.title');

    try {
      const WAIT = 1000;
      const ITERATIONS = 8;

      let newTitle = this.get('i18n').t('generic.app_update_received_browser_tab_title');

      let titles = [newTitle, originalTitle];

      let count = 0;
      while (count < ITERATIONS) {
        yield timeout(WAIT);

        let [head, tail] = titles;
        this.set('headData.title', head);
        titles = [tail, head];

        count = count + 1;
      }
    } finally {
      this.set('headData.title', originalTitle);
    }
  }).drop(),

  _bindWindowFocusEvent() {
    if (this._windowFocusEventBound) { return; }

    this.get('window').one('focus', this, () => {
      this._restoreFavicon();
      this._restoreTitle();
      this._windowFocusEventBound = false;
    });

    this._windowFocusEventBound = true;
  },

  _favicons() {
    let icons = [];
    let links = document.getElementsByTagName('head')[0].getElementsByTagName('link');

    for (var i = 0; i < links.length; i++) {
      let link = links[i];
      if (link.getAttribute('rel') === 'icon') {
        icons.push(link);
      }
    }

    return icons;
  },

  _canvasContext() {
    let canvas = document.createElement('canvas');
    canvas.width = canvas.height = FAVICON_WIDTH_HEIGHT;

    return canvas.getContext('2d');
  },

  _dataUrl(context) {
    return context.canvas.toDataURL('image/png');
  }
});
