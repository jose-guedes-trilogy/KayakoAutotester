import { get } from '@ember/object';
import { scheduleOnce } from '@ember/runloop';
import { inject as service } from '@ember/service';
import EmberRouter from '@ember/routing/router';
import config from './config/environment';

const Router = EmberRouter.extend({
  location: config.locationType,
  metrics: service(),
  urlService: service('url'),
  // appcues: service(),
  rootURL: config.rootURL,

  didTransition() {
    this._super(...arguments);
    this._reloadUserpilot();
    this._trackPage();
    this._updateUrlService();
    // this._scheduleAppcues();
    return true;
  },

  willTransition(oldInfos, newInfos, transition) {
    let { url } = transition.intent;

    if (url && url.includes && url.includes('case')) {
      let newUrl = url.replace(/case/g, 'conversation');
      transition.abort();
      this.replaceWith(newUrl);
    } else {
      this._super(...arguments);
    }
  },

  _trackPage() {
    scheduleOnce('afterRender', this, () => {
      const title = this.getWithDefault('currentRouteName', 'unknown');

      // sequence is important!
      let category = 'Unknown';
      if (title.match(/^session\.admin\.account/)) {
        category = 'Account';
      } else if (title.match(/^session\.admin/)) {
        category = 'Admin';
      } else if (title.match(/^session\.agent\.insights/)) {
        category = 'Insights';
      } else if (title.match(/^session\.agent/)) {
        category = 'Agent';
      }

      get(this, 'metrics').trackPage({
        page: title,
        title,
        category
      });
    });
  },

  _reloadUserpilot() {
    scheduleOnce('afterRender', this, () => {
      window.userpilot.reload();
    });
  },

  _updateUrlService() {
    this.get('urlService').set('currentUrl', this.get('url'));
  },

  /** _scheduleAppcues() {
    let appcues = this.get('appcues');
    scheduleOnce('afterRender', () => appcues.start());
  } */
});

Router.map(function() {

  // Ideally these would all be nested under `/login` but we need the root to be `/agent` or `/admin`
  // due to the way the app is mounted as we don't own `/`
  this.route('login-regular', { path: '/agent/login/regular' });
  this.route('login-agent', { path: '/agent/login' });
  this.route('login-admin', { path: '/admin/login' });
  this.route('login-agent-testing', { path: '/agent-testing' });
  this.route('login-admin-testing', { path: '/admin-testing' });

  this.route('session', { path: '/' }, function() {
    if (config.environment !== 'production') {
      this.route('test', { path: '/test' }, function () {
        this.route('entry', { path: '/:entry_id' });
      });
    }

    this.route('agent', function () {
      this.route('welcome');

      this.route('knowledgebase', function() {
        this.route('index', {path: '/'});
        this.route('article-view', { path: '/:id' });
        this.route('create-article', {path: '/create-article'});
      });

      this.route('search-new', {path: '/search-new/:hash'});
      this.route('search', {path: '/search/:term'});

      this.route('conversation-new');

      this.route('cases', { path: '/conversations' }, function() {
        this.route('new', { path: '/new/:timestamp' }, function() {
          this.route('user');
          this.route('organization');
          this.route('conversation');
        });

        this.route('index', { path: '/' }, function() {
          this.route('view', { path: '/view/:view_id' });
          this.route('suspended-messages', function() {
            this.route('show', { path: ':id' });
          });
        });

        this.route('case', { path: '/:case_id' }, function() {
          this.route('organization');
          this.route('user');
        });
      });
      this.route('users', { path: '/users' }, function() {
        this.route('user', { path: '/:user_id' }, function() {
          this.route('organization');
        });
        this.route('new', { path: '/new/:timestamp' }, function() {
          this.route('user');
          this.route('organization');
        });
      });
      this.route('organizations', { path: '/organizations' }, function() {
        this.route('organization', { path: '/:organization_id' }, function() {
        });
        this.route('new', { path: '/new/:timestamp' }, function() {});
      });

      this.route('insights', function() {
        this.route('general', { path: '/general' }, function() {
          this.route('agents');
          this.route('teams');
          this.route('cases', { path: '/conversations' });
        });

        this.route('reporting', function() {
          this.route('custom-reports', function() {
            this.route('index', { path: '/' });
            this.route('new');
            this.route('edit', { path: '/:report_id' });
          });
        });

        this.route('sla', { path: '/sla' }, function() {
          this.route('overview');
        });

        this.route('help-center', function() {
          this.route('searches');
          this.route('articles');
        });
      });

      this.route('impersonate');
    });

    this.route('admin', function() {

      this.route('messenger', function() {
        this.route('configure');
        this.route('identity-verification', function() {
          this.route('android');
          this.route('ios');
        });
        this.route('engagements', function() {
          this.route('new');
          this.route('edit', { path: '/:engagement_id' });
        });
      });

      this.route('manage', { path: '/conversations' }, function() {
        this.route('views', function() {
          this.route('edit', { path: '/:view_id'});
          this.route('new', { path: '/new' });
        });

        this.route('case-forms', { path: '/forms' }, function() {
          this.route('new');
          this.route('edit', { path: '/:case_form_id' });
        });

        this.route('time-tracking');
      });

      this.route('customizations', function() {
        this.route('brands', function () {
          this.route('new', { path: '/new' });
          this.route('edit', { path: '/:brand_id' }, function () {
            this.route('templates', { path: '/templates' });
          });
        });

        this.route('email-templates');

        this.route('case-fields', { path: '/conversation-fields' }, function() {
          this.route('select-type', { path: '/select-type'});
          this.route('new', { path: '/new/:type'});
          this.route('edit', { path: '/:case_field_id'});
        });

        this.route('organization-fields', function() {
          this.route('select-type', { path: '/select-type'});
          this.route('new', { path: '/new/:type'});
          this.route('edit', { path: '/:organization_field_id'});
        });

        this.route('user-fields', function() {
          this.route('select-type', { path: '/select-type'});
          this.route('new', { path: '/new/:type'});
          this.route('edit', { path: '/:user_field_id'});
        });

        this.route('localization', function () {
          this.route('languages');
          this.route('settings');
        });
        this.route('privacy', function() {
          this.route('edit',{ path: '/:privacy_id' });
          this.route('new');
        });
      });

      this.route('people', { path: '/team-settings' }, function() {
        this.route('staff', { path: '/agent-directory' }, function() {
          this.route('add');
        });

        this.route('teams', function() {
          this.route('new');
          this.route('edit', {path: '/:team_id'});
        });

        this.route('businesshours', function() {
          this.route('new', {path: '/new'});
          this.route('edit', {path: '/:businesshour_id'});
        });

        this.route('roles', function() {
          this.route('new', { path: '/new'});
          this.route('edit', { path: '/:role_id'});
        });
      });

      this.route('account', function() {
        this.route('trial', function () {
        });
        this.route('overview', function () {
        });
        this.route('plans', { path: '/plan' }, function () {
        });
        this.route('billing');
      });

      this.route('automation', function() {
        this.route('macros', function() {
          this.route('new');
          this.route('edit', { path: '/:macro_id' });
        });

        this.route('triggers', function() {
          this.route('new', {path: '/new'});
          this.route('edit', {path: '/:trigger_id'});
        });

        this.route('sla', function () {
          this.route('new', { path: '/new' });
          this.route('edit', { path: '/:sla_id' });
        });
        this.route('monitors', function() {
          this.route('new');
          this.route('edit', { path: '/:monitor_id' });
        });
      });

      this.route('apps', { path: '/integrations' }, function() {

        this.route('manage', function() {
          this.route('index', { path: '/' });
          this.route('edit', { path: '/edit/:app_installation_id' });
          this.route('show', { path: '/details/:app_id' });
        });

        this.route('endpoints', function() {
          this.route('select-type', { path: '/select-type'});
          this.route('new', {path: '/new/:type'});
          this.route('edit', {path: '/:endpoint_id'});
          this.route('index', {path: '/'}, function() {
            this.route('details', {path: '/:endpoint_id/details'});
          });
        });

        this.route('salesforce');
        this.route('zapier');
        this.route('api', function() {
          this.route('oauth-apps', function() {
            this.route('new', { path: '/new' });
            this.route('edit', { path: '/:app_id' });
          });
        });

        this.route('webhooks', function() {
          this.route('new', {path: '/new'});
          this.route('edit', { path: '/:webhook_id' });
        });

        this.route('atlasai');
      });

      this.route('channels', function() {
        this.route('twitter', function() {
          this.route('edit', {path: '/:account_id'});
          this.route('callback');
          this.route('reauthorize');
        });

        this.route('email', function () {
          this.route('settings');
          this.route('new', {path: '/new'});
          this.route('edit', { path: '/:mailbox_id' });
        });

        this.route('facebook', function() {
          this.route('edit', {path: '/:page_id'});
          this.route('callback');
        });
      });

      this.route('settings', function () {
        this.route('security', function () {
          this.route('customers');
        });
        this.route('users');
      });

      this.route('security', function () {
        this.route('authentication', function () {
          this.route('customers');
        });
        this.route('policy', function () {
          this.route('customers');
          this.route('help-center');
        });
        this.route('settings');
      });
    });
    this.route('errors.not-found', {path: '*path'});
  });
});

export default Router;
