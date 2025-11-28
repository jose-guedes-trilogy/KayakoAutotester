import Mixin from '@ember/object/mixin';

export default Mixin.create({
  ajaxOptions(url, type, options = {}) {
    if (type === 'GET') {
      options.data = options.data || {};
      if (!options.data.limit) {
        options.data.limit = '10000';
      }
    }

    return this._super(url, type, options);
  }
});
