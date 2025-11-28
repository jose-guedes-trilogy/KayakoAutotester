/* global window */
import Service from '@ember/service';

import { capitalize } from '@ember/string';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import moment from 'moment';
import { assign } from '@ember/polyfills';
import { getOwner } from '@ember/application';
import { getMetaData } from 'frontend-cp/utils/bugsnag';

const _humaniseKey = (key) => {
  return capitalize(key.split('.').get('lastObject').replace(/_/g, ' '));
};

export default Service.extend({
  intl: service(),
  store: service(),

  timeFormatSetting: computed(function() {
    return this.get('store').peekAll('setting').findBy('name', 'time_format');
  }),

  hour12: computed('timeFormatSetting.value', function() {
    return this.get('timeFormatSetting.value') !== '24hour';
  }),

  now() {
    return moment();
  },

  t(key, ...args) {
    return this._translateAndLogErrors(key, () => this.get('intl').t(key, ...args));
  },

  findTranslationByKey(key) {
    return this._translateAndLogErrors(key, () => this.get('intl').findTranslationByKey(key));
  },

  formatMessage(key, ...args) {
    return this._translateAndLogErrors(key, () => this.get('intl').formatMessage(key, ...args));
  },

  formatHtmlMessage(key, ...args) {
    const translation = this.findTranslationByKey(key);
    let formattedHtmlMessage;
    try {
      formattedHtmlMessage = this.get('intl').formatHtmlMessage(translation, ...args);
    } catch(e) {
      this._logError(key, e);
    }
    return formattedHtmlMessage;
  },

  formatNumber(key, ...args) {
    return this.get('intl').formatNumber(key, ...args);
  },

  formatDate(key, hash) {
    hash.hour12 = this.get('hour12');
    if (key) {
      return this.get('intl').formatDate(...arguments);
    } else {
      return null;
    }
  },

  formatRelative(key, ...args) {
    if (key) {
      return this.get('intl').formatRelative(key, ...args);
    } else {
      return null;
    }
  },

  formatTime(time, options) {
    if (!time) { return null; }

    let intl = this.get('intl');
    let hour12 = this.get('hour12');
    let { timeZone } = options;

    options = assign({}, { hour12 }, options);

    if (timeZone) {
      Reflect.deleteProperty(options, 'timeZone');

      let momentZone = moment.tz.zone(timeZone);
      let zoneOffset = momentZone.offset(time);
      let localOffset = this.now().utcOffset();

      // Because the `timeZone` option on Intl.DateTimeFormat is not 100%
      // supported across target browsers we must translate our time object
      // into the target zone before we try to format it.
      time = moment(time)
        .subtract(localOffset, 'm') // translate into UTC
        .subtract(zoneOffset, 'm') // translate into target TZ
        .toDate();
    }

    return intl.formatTime(time, options);
  },

  exists(key) {
    return this.get('intl').exists(key);
  },

  _logError(key, e) {
    if (console && console.error) { // eslint-disable-line
      console.error(`Failed to translate ${key}: ${e}`); // eslint-disable-line
    }

    let context = getMetaData(null, getOwner(this));
    context.intl = {
      key
    };
    if (window && window.Bugsnag && window.Bugsnag.apiKey !== undefined) {
      window.Bugsnag.notifyException(e, `Failed to translate ${key}`, context, 'info');
    }
  },

  _translateAndLogErrors(key, fn) {
    try {
      const message = fn();
      if (message.match(/^Missing translation:/)) {
        this._logError(key, message);
        return _humaniseKey(key);
      } else {
        return message;
      }
    } catch (e) {
      this._logError(key, e);
      return _humaniseKey(key);
    }
  }
});
