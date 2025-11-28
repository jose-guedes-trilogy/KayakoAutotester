export function createDefaultCaseStatuses(server) {
  return [
    newCaseStatus(server),
    openCaseStatus(server),
    pendingCaseStatus(server),
    completedCaseStatus(server),
    closedCaseStatus(server)
  ];
}

export function newCaseStatus(server) {
  let newStatus = server.db.caseStatuses.find(1);
  return newStatus || server.create('case-status', {
    label: 'New',
    type: 'NEW',
    id: 1
  });
}

export function openCaseStatus(server) {
  let openStatus = server.db.caseStatuses.find(2);
  return openStatus || server.create('case-status', {
    label: 'Open',
    type: 'OPEN',
    id: 2
  });
}

export function pendingCaseStatus(server) {
  let pendingStatus = server.db.caseStatuses.find(3);
  return pendingStatus || server.create('case-status', {
    label: 'Pending',
    type: 'PENDING',
    id: 3
  });

}

export function completedCaseStatus(server) {
  let completedStatus = server.db.caseStatuses.find(4);
  return completedStatus || server.create('case-status', {
    label: 'Completed',
    type: 'COMPLETED',
    id: 4
  });
}

export function closedCaseStatus(server) {
  let closedStatus = server.db.caseStatuses.find(5);
  return closedStatus || server.create('case-status', {
    label: 'Closed',
    type: 'CLOSED',
    id: 5
  });
}
