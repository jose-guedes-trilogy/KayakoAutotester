import {
    app,
    test
} from 'frontend-cp/tests/helpers/qunit';

import {
    getCookies,
    getRegistrations,
    assertRows
} from './helpers';

app('Acceptance | admin/customizations/privacy', {
    beforeEach() {
        const en = server.create('locale', { id: 1, locale: 'en-us', name: 'English', is_public: true, is_localized: true });

        server.create('privacy-policy', { id: 1,  url: 'https://test1.dev/en_us/COOKIE', privacy_type: 'COOKIE', locale: 'en_us'});
        server.create('privacy-policy', { id: 2,  url: 'https://test1.dev/rus/COOKIE', privacy_type: 'COOKIE', locale: 'rus'});
        server.create('privacy-policy', { id: 3,  url: 'https://test2.dev/hy_am/REGISTRATION', privacy_type: 'REGISTRATION', locale: 'hy_am'});

        const role = server.create('role', { type: 'ADMIN' });
        const user = server.create('user', { role, locale: en, time_zone: 'Europe/London' });
        const session = server.create('session', { user });

        login(session.id);

        // Do not forger to include this line
        server.create('plan', { limits: { agents: 20 }, features: [], account_id: '123', subscription_id: '123' });
    },

    afterEach() {
        logout();
    }
});

test('listing privacies', function (assert) {
    visit('/admin/customizations/privacy');
    andThen(() => {
        assertRows(assert, [
            ['https://test1.dev/en_us/COOKIE', ['canEdit']],
            ['https://test1.dev/rus/COOKIE', ['canEdit']]
        ], [
            ['https://test2.dev/hy_am/REGISTRATION', ['canEdit']]            
        ]);
    });
});

test('opening a privacy edit page by clicking on the row for cookies', function (assert) {
    visit('/admin/customizations/privacy');
    andThen(() => click(getCookies().eq(0)));
    andThen(() => assert.equal(currentURL(), '/admin/customizations/privacy/1'));
});

test('opening a privacy edit page by clicking on the row for registration', function (assert) {
    visit('/admin/customizations/privacy');
    andThen(() => click(getRegistrations().eq(0)));
    andThen(() => assert.equal(currentURL(), '/admin/customizations/privacy/3'));
});
