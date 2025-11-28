import Helper from '@ember/component/helper';

export default Helper.helper(([func, ...rest]) => Reflect.apply(func, this, rest));
