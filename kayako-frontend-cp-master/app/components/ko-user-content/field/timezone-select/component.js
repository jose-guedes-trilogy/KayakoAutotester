import { oneWay } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import Component from '@ember/component';

export default Component.extend({
  // Params
  isEdited: false,
  isErrored: false,
  isKREEdited: false,
  onChangeTimezone: null,
  timezone: null,
  isDisabled: false,

  timezoneService: service('timezones'),

  tagName: '',

  timezones: oneWay('timezoneService.timeZones')

});
