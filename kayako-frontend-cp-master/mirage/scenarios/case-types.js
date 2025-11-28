export function createDefaultCaseTypes(server) {
  return [
    questionCaseType(server)
  ];
}

export function questionCaseType(server) {
  let questionType = server.db.caseTypes.find(1);
  return questionType || server.create('case-type', {
    label: 'Question',
    id: 4
  });
}
