export function admin(server) {
  let adminRole = server.db.roles.find(1);
  return adminRole || server.create('role', {
    title: 'Admin',
    type: 'ADMIN',
    id: 1
  });
}

export function agent(server) {
  let agentRole = server.db.roles.find(2);
  return agentRole || server.create('role', {
    title: 'Agent',
    type: 'AGENT',
    id: 2
  });
}

export function collaborator(server) {
  let collaboratorRole = server.db.roles.find(3);
  return collaboratorRole || server.create('role', {
    title: 'Collaborator',
    type: 'COLLABORATOR',
    id: 3
  });
}

export function customer(server) {
  let customerRole = server.db.roles.find(4);
  return customerRole || server.create('role', {
    title: 'Customer',
    type: 'CUSTOMER',
    id: 4
  });
}

export function owner(server) {
  let ownerRole = server.db.roles.find(5);
  return ownerRole || server.create('role', {
    title: 'Owner',
    type: 'OWNER',
    id: 5
  });
}
