import rel from '../utils/rel';

export function createNoteChannel(server) {
  return server.create('channel', {
    type: 'NOTE',
    character_limit: null,
    account: null
  });
}

export function createDefaultMailChannel(server) {
  let account = server.create('mailbox', {
    address: 'support@brewfictus.com',
    is_default: true
  });

  return server.create('channel', {
    type: 'MAIL',
    account: rel(account)
  });
}
