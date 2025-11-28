import { resolve } from 'rsvp';
import Evented from '@ember/object/evented';
import EmberObject from '@ember/object';
import MockLocation from '../location/mock-location';

export default EmberObject.extend(Evented, {
  init: function() {
    this._super();
    this.set('location', this.get('location') || MockLocation.create());
  },
  location: null,
  transitionTo: function(url) {
    let location = this.get('location');
    let path = location.formatURL(url);
    let state = {
      path: path
    };
    location.get('history').pushState(state, null, path);
    return resolve().then(() => {
      this.trigger('didTransition');
    });
  }
});
