import { reject } from 'rsvp';
import { A } from '@ember/array';
import { or } from '@ember/object/computed';
import EmberObject, {
  defineProperty,
  computed
} from '@ember/object';
import Service, { inject as service } from '@ember/service';
import { getOwner } from '@ember/application';
import MapWithDefault from '@ember/map/with-default';
import _ from 'npm:lodash';
import { model, attr } from 'frontend-cp/services/virtual-model';

const cleanupKey = setting => setting.split('.').join('_');

export default Service.extend({
  // Services
  store: service(),
  virtualModel: service(),

  selectByKeys(keys) {
    const allSettings = this.get('store').peekAll('setting');
    const settings = _.fromPairs(
      keys
        .map(key => allSettings.findBy('key', key))
        .map(setting => [cleanupKey(setting.get('key')), setting])
    );

    const wrapper = EmberObject.create(settings);
    wrapper.save = (() => {
      const adapter = getOwner(this).lookup('adapter:application');
      return Reflect.apply(this._save, wrapper, [settings, adapter]);
    });
    return wrapper;
  },

  generateSchema(settingKeys) {
    return model('', _.fromPairs(
      settingKeys.map(key => [cleanupKey(key), model('setting', {
        value: attr()
      })])
    ));
  },

  initEdits(settings, schema) {
    const editedSettings = this.set('editedSettings', this.get('virtualModel').makeSnapshot(settings, schema));
    const names = Object.keys(editedSettings);
    names.forEach(name => {
      const editedSetting = editedSettings.get(name);
      const originalSetting = settings.get(name);
      editedSetting.set('original', originalSetting);
      defineProperty(editedSetting, 'isEdited', computed('value', 'original.value', function () { // eslint-disable-line prefer-reflect
        return this.get('value') !== this.get('original.value');
      }));
    });
    const editedKeys = names.map(name => `${name}.isEdited`);
    defineProperty(editedSettings, 'isEdited', or(...editedKeys)); // eslint-disable-line prefer-reflect
    return editedSettings;
  },

  _save(settings, adapter) {
    const values = _.fromPairs(_.map(settings, setting => [setting.get('key'), setting.get('value')]));

    return adapter.ajax(`${adapter.namespace}/settings`, 'PUT', {
      data: {
        values
      }
    })
    .catch((result) => {
      let errors = MapWithDefault.create({
        defaultValue() {
          return A();
        }
      });

      result.errors.forEach(error => {
        let regex = /\/values\/([\w.]+)/;
        let results = error.pointer.match(regex);
        let key = results[1];
        errors.get(cleanupKey(key)).pushObject({ message: error.message });
      });

      this.set('errors', {
        errorsByAttributeName: errors
      });

      return reject(result);
    });
  }
});
