import EmberObject from '@ember/object';

export default EmberObject.extend({
  length: null,
  isTruthy: true,

  unknownProperty(key) {
    let path = this.get('key') + '.' + key;
    let error = new Error(path);
    console.error(error); /* eslint no-console: "off" */
  },

  makeNoisyChild(key, attrs) {
   return this.constructor.create(Object.assign({
     key: this.get('key') + '.' + key
   }, attrs));
  }
});
