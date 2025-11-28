import { admin, agent, collaborator, customer, owner } from './roles';
import { defaultLocale } from './locales';
import { createPhoneIdentity, createEmailIdentity, createTwitterIdentity, createFacebookIdentity } from './identities';

export function createAdmin(server, fullName, organization, phones, emails, twitters, facebooks) {
  let adminRole = admin(server);

  let phoneIdentities = phones || [];
  phoneIdentities.push(createPhoneIdentity(server, '+44 4928581320', true, false));
  phoneIdentities.push(createPhoneIdentity(server, '+44 4928581321', false, false));
  phoneIdentities.push(createPhoneIdentity(server, '+44 7977 1234567891011121314151617181920', false, false));

  let emailIdentities = emails || [];
  emailIdentities.push(createEmailIdentity(server, 'primary@gmail.com', true, true, false));
  emailIdentities.push(createEmailIdentity(server, 'validated@gmail.com', false, true, false));
  emailIdentities.push(createEmailIdentity(server, 'unvalidated.secondary@gmail.com', false, false, false));

  let twitterIdentities = twitters || [];
  twitterIdentities.push(createTwitterIdentity(server, 'primary', true, false));
  twitterIdentities.push(createTwitterIdentity(server, 'secondary', false, false));
  twitterIdentities.push(createTwitterIdentity(server, 'Charles_Philip_Arthur_George_Mountbatten_Windsor48', false, false));

  let facebookIdentities =  facebooks || [];
  facebookIdentities.push(createFacebookIdentity(server, 'primary' , 'Primary McPrime', true, false));
  facebookIdentities.push(createFacebookIdentity(server, null, 'secondary', false, false));
  facebookIdentities.push(createFacebookIdentity(server, 'Charles Philip Arthur George Mountbatten-Windsor', 'Long', false, false));

  return _createUser(server, organization, fullName, adminRole, phoneIdentities, emailIdentities, twitterIdentities, facebookIdentities);
}

export function createAgent(server, fullName, organization, phones, emails, twitters, facebooks) {
  let agentRole = agent(server);
  let phoneIdentities = phones || [];
  let emailIdentities = emails || [];
  let twitterIdentities = twitters || [];
  let facebookIdentities =  facebooks || [];

  return _createUser(server, organization, fullName, agentRole, phoneIdentities, emailIdentities, twitterIdentities, facebookIdentities);
}

export function createCollaborator(server, fullName, organization, phones, emails, twitters, facebooks) {
  let collaboratorRole = collaborator(server);
  let phoneIdentities = phones || [];
  let emailIdentities = emails || [];
  let twitterIdentities = twitters || [];
  let facebookIdentities =  facebooks || [];

  return _createUser(server, organization, fullName, collaboratorRole, phoneIdentities, emailIdentities, twitterIdentities, facebookIdentities);
}

export function createCustomer(server, fullName, organization, phones, emails, twitters, facebooks) {
  let customerRole = customer(server);
  let phoneIdentities = phones || [];
  let emailIdentities = emails || [];
  emailIdentities.push(createEmailIdentity(server, 'customer@gmail.com', true, true, false));

  let twitterIdentities = twitters || [];
  let facebookIdentities =  facebooks || [];

  return _createUser(server, organization, fullName, customerRole, phoneIdentities, emailIdentities, twitterIdentities, facebookIdentities);
}

export function createOwner(server, fullName, organization, phones, emails, twitters, facebooks) {
  let ownerRole = owner(server);
  let phoneIdentities = phones || [];
  let emailIdentities = emails || [];
  let twitterIdentities = twitters || [];
  let facebookIdentities =  facebooks || [];

  return _createUser(server, organization, fullName, ownerRole, phoneIdentities, emailIdentities, twitterIdentities, facebookIdentities);
}

function _createUser(server, organization, fullName, role, phoneIdentities, emailIdentities, twitterIdentities, facebookIdentities) {
  let locale = defaultLocale(server);

  return server.create('user', {
    full_name: fullName,
    custom_fields: [],
    role: { id: role.id, resource_type: 'role' },
    teams: [],
    phones: phoneIdentities.map(function(item) { return { id: item.id, resource_type: 'identity_phone'}; }),
    emails: emailIdentities.map(function(item) { return { id: item.id, resource_type: 'identity_email'}; }),
    facebook: facebookIdentities.map(function(item) { return { id: item.id, resource_type: 'identity_facebook'}; }),
    twitter: twitterIdentities.map(function(item) { return { id: item.id, resource_type: 'identity_twitter'}; }),
    metadata: {},
    organization: organization? { id: organization.id, resource_type: 'organization' } : null,
    tags: [],
    locale: { id: locale.id, resource_type: 'locale' },
    time_zone: 'Europe/London'
  });
}
