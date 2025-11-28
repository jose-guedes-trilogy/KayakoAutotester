export function createPhoneIdentity(server, phoneNumber, isPrimary, isNew) {
  return server.create('identity-phone', {
    number: phoneNumber,
    is_primary: isPrimary,
    is_new: isNew
  });
}

export function createEmailIdentity(server, email, isPrimary, isValidated, isNew) {
  return server.create('identity-email', {
    email: email,
    is_primary: isPrimary,
    is_validated: isValidated,
    is_new: isNew
  });
}

export function createTwitterIdentity(server, screenName, isPrimary, isNew) {
  return server.create('identity_twitter', {
    screen_name: screenName,
    is_primary: isPrimary,
    is_new: isNew
  });
}

export function createFacebookIdentity(server, userName, fullName, isPrimary, isNew) {
  return server.create('identity_facebook', {
    user_name: userName,
    full_name: fullName,
    is_primary: isPrimary,
    is_new: isNew
  });
}
