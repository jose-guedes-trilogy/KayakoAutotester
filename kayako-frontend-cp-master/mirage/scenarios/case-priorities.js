export function createDefaultCasePriorities(server) {
  return [
    lowCasePriority(server),
    normalCasePriority(server)
  ];
}

export function lowCasePriority(server) {
  let lowPriority = server.db.casePriorities.find(1);
  return lowPriority || server.create('case-priority', {
    locales: [],
    label: 'Low',
    id: 6
  });
}

export function normalCasePriority(server) {
  let normalPriority = server.db.casePriorities.find(2);
  return normalPriority || server.create('case-priority', {
    locales: [],
    label: 'Normal',
    id: 3
  });
}
