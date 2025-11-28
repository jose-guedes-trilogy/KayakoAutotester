/**
 * Returns a relationship object for a given mirage resource.
 *
 *     rel(someCase) // => { id: '123', resource_type: 'case' }
 *     rel(someUser) // => { id: '456', resource_type: 'user' }
 *
 * @method rel
 * @param {Object} resource
 * @returns {Object} relationship
 */
const rel = ({ id, resource_type }) => ({ id, resource_type });

export default rel;
