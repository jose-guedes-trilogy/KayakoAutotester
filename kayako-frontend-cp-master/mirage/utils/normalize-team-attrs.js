import { assign } from '@ember/polyfills';

export default function normalizeTeamAttrs(attrs) {
  let result = assign({}, attrs );

  if (attrs.businesshour_id) {
    result.businesshour = {
      id: attrs.businesshour_id,
      resource_type: 'business_hour'
    };
  }
  Reflect.deleteProperty(result, 'businesshour_id');

  return result;
}
