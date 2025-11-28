export default function loginAsAdmin() {
  let locale = server.create('locale');
  let role = server.create('role', { roleType: 'ADMIN' });
  let user = server.create('user', { locale, role });
  let session = server.create('session', { user });

  if (!server.db.plans.length) {
    server.create('plan');
  }

  login(session.id);
}
