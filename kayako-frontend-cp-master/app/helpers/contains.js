import Helper from '@ember/component/helper';

export default Helper.extend({
  compute(params, hash) {
    const item = params[0];
    const list = params[1];
    return list && list.length && params[1].includes(item);
  }
});
