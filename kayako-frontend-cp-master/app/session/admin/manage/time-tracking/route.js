import Route from '@ember/routing/route';

export default Route.extend({
  model() {
    return this.get('store').findAll('setting', { reload: true })
      .then(settings => settings.findBy('name', 'timetracking'))
      .then(setting => setting && setting.get('toBoolean'));
  }
});
