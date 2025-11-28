const EMAIL_REGEX = /^[^@]+@([^@.]+\.)+[^@.]{2,}$/;
const TWITTER_REGEX = /(^|[^@\w])@(\w{1,15})\b$/;
const PHONE_REGEX = /^\s*(?:\+?(\d{1,3}))?([-. (]*(\d{3})[-. )]*)?((\d{3})[-. ]*(\d{2,4})(?:[-.x ]*(\d+))?)\s*$/;

export function validateEmailFormat(email) {
  return EMAIL_REGEX.test(email);
}

export function validateTwitterHandleFormat(email) {
  return TWITTER_REGEX.test(email);
}

export function validatePhoneFormat (phone) {
  return PHONE_REGEX.test(phone);
}
