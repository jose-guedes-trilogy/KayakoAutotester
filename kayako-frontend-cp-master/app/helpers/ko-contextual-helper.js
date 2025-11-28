import { helper } from '@ember/component/helper';

/*
 * The same as ko-helper, except one can pass in a context.
 * Use case is a passing the component context through so properties can be
 * got or set
 *
 * See ko-case-content for an example
 *
 * args 0 - the function
 * args 1 - the context
 * args... - arguments to the function
 */
export default helper((args) => {
  return Reflect.apply(args[0], args[1], args.slice(2));
});
