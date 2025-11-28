import { helper } from '@ember/component/helper';

export default helper((fieldType) => {
  if (fieldType.length) {
    return 'admin.casefields.type.' + fieldType[0].toLowerCase() + '.name';
  }
});
