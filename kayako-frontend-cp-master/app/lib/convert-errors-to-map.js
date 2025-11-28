import EmberObject from '@ember/object';

export default function (errors) {
  return (errors || []).reduce((errorMap, error) => {
    // non-validation errors (403 permission denied etc) don't have error.source
    if (error.source && error.source.pointer) {
      const attrName = error.source.pointer.replace('data/attributes/', '');
      errorMap.set(attrName, true);
    }
    return errorMap;
  }, EmberObject.create({}));
}
