import Service from '@ember/service';
import { inject as service } from '@ember/service';
import kayakoWebPush from 'npm:kayako-web-push';
import injectScript from 'ember-inject-script';
import platform from 'npm:platform';
import uuid from 'npm:uuid';
const { hasSupport, getPermission, registerServiceWorker, registerDevice } = kayakoWebPush;

export default Service.extend({
  store: service(),
  session: service(),
  localStore: service(),
  errorHandler: service(),
  devices: [],

  /**
   * Returns a boolean indicating if there is a uuid
   * saved in localstorage
   *
   * @method hasPushUuid
   *
   * @return {Boolean}
   */
  hasPushUuid () {
    return !!this.get('localStore').getItem('push', 'uuid', { persist: true });
  },

  /**
   * Returns the existing uuid or creates a new one
   * and saves it to localstorage
   *
   * @method getPushUuid
   *
   * @return {String}
   */
  getPushUuid () {
    if (!this.hasPushUuid()) {
      const pushUuid = uuid.v4();
      this.get('localStore').setItem('push', 'uuid', pushUuid, { persist: true });
      return pushUuid;
    }
    return this.get('localStore').getItem('push', 'uuid', { persist: true });
  },

  /**
   * Get public key from the server
   *
   * @method getPublicKey
   * @async
   *
   * @return {String}
   */
  async getPublicKey () {
    const credentials = await this.get('store').queryRecord('credential', {});
    return credentials.get('webpushPublicKey');
  },

  /**
   * Loads devices from the API
   *
   * @method loadDevices
   *
   * @return {void}
   */
  async loadDevices () {
    const devices = await this.get('store').findAll('device');
    this.set('devices', devices);
  },

  /**
   * Returns device for given uuid.
   *
   * @method findRegisteredDevice
   *
   * @param  {String}            forUuid
   *
   * @return {Boolean}
   */
  findRegisteredDevice (forUuid) {
    return this.get('devices').findBy('fingerprintUuid', forUuid);
  },

  /**
   * Register the user device with the server. This needs to
   * be done only when we create a new subscription with
   * the browser, otherwise user browser will be registered
   * twice and they will get multiple notifications.
   *
   * @method registerDeviceWithServer
   * @async
   *
   * @param  {Object}                 payload
   *
   * @return {Model}
   */
  async registerDeviceWithServer (payload) {
    const device = this.get('store').createRecord('device', {
      deviceType: 'Browser',
      fingerprintUuid: this.getPushUuid(),
    });

    const deviceProperties = this.get('store').createRecord('device-property', {
      lastIpAddress: this.get('session.ipAddress'),
      subscriptionInfo: JSON.stringify(payload),
      osVersion: `${platform.os.family} ${platform.os.version}`,
      deviceManufacturer: platform.manufacturer
    });

    device.set('deviceProperties', deviceProperties);
    return this.get('errorHandler').disableWhile(() => {
      return device.save();
    });
  },

  /**
   * Register the user device with the browser and
   * on the server
   *
   * @method registerUserDevice
   * @async
   *
   * @return {void}
   */
  async registerUserDevice () {
    let hasRegisteredDevice = false;

    /**
     * Browser doesn't support web push
     */
    if (!hasSupport()) {
      return;
    }

    await injectScript('/agent/kayako-push-service.js');

    /**
     * Register the service to be used for listening for push
     * notifications.
     *
     * @type {Object}
     */
    const kayakoPushService = window.kayakoPushService;
    const registration = await kayakoPushService.register(registerServiceWorker, '/agent/service-worker.js');

    /**
     * Finding if user device is already registered or not
     * only when there is an existing uuid in the local
     * storage
     */
    if (this.hasPushUuid()) {
      await this.loadDevices();
      hasRegisteredDevice = !!this.findRegisteredDevice(this.getPushUuid());
    }

    /**
     * If user device is already registered, don't do anything
     */
    if (hasRegisteredDevice) {
      return;
    }

    /**
     * Get public key from server and only continue
     * if it already exists.
     *
     * @type {String}
     */
    const publicKey = await this.getPublicKey();
    if (!publicKey) {
      return;
    }

    /**
     * Getting the status of notifications permission and
     * only continue if permission was granted
     *
     * @type {String}
     */
    const notificationsPermission = await getPermission();
    if (notificationsPermission !== 'granted') {
      return;
    }

    /**
     * Registering the user device with the browser.
     *
     * @type {Object}
     */
    const subscription = await registerDevice(publicKey, registration);

    /**
     * Finally send the subscription payload to the server, so that
     * user can receive notifications.
     */
    await this.registerDeviceWithServer(subscription);
  }
});
