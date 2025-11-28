function createPrivacy(server, locale, url, privacy_type, defaultValue = false) {
    return server.create('privacy-policy', {locale, url, privacy_type, default: defaultValue});
}

export function createPrivacyExamples(server) {
    createPrivacy(server, 'us-en', 'us.com', 'REGISTRATION', true);
    createPrivacy(server, 'ru', 'ru.com', 'COOKIE');
    return server.privacies;
}
