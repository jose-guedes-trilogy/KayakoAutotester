import Mirage from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  id: i => i + 1,
  locale: 'en-us',
  name: 'English',
  native_name: 'English',
  region: '',
  nativeRegion: '',
  script: '',
  variant: '',
  direction: 'LTR',
  is_enabled: true,
  is_public: true,
  is_localized: true,
  created_at: '2015-07-09T15:36:10Z',
  updated_at: '2015-07-09T15:36:10Z',
  resource_type: 'locale',
  resource_url: 'http://novo/api/index.php?/v1/locales/1'
});
