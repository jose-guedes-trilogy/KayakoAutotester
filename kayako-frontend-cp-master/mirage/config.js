/* eslint-disable */

import Mirage from 'ember-cli-mirage';
import moment from 'moment';
import Ember from 'ember';
import _ from 'npm:lodash';

import account from './fixtures/account';
import notificationPreferences from './fixtures/notification_preferences';
import organizationMembers from './fixtures/organization_members';
import insightsCasesCsat from './fixtures/insights_cases_csat';
import insightsCasesCompleted from './fixtures/insights_cases_completed';
import insightsCasesMetrics from './fixtures/insights_cases_metrics';
import insightsCasesResolution from './fixtures/insights_cases_resolution';
import insightsCasesResponse from './fixtures/insights_cases_response';
import insightsSlaOverview from './fixtures/insights_sla_overview';
import insightsSlaTarget from './fixtures/insights_sla_target';
import insightsSlaPerformance from './fixtures/insights_sla_performance';
import insightsHelpcenterSearches from './fixtures/insights_helpcenter_searches';
import insightsHelpcenterArticles from './fixtures/insights_helpcenter_articles';
import normalizeTeamAttrs from './utils/normalize-team-attrs';
import gatherSideloadedResources from './utils/gather-sideloaded-resources';
import arrayToObjectWithNumberedKeys from './utils/array-to-object-with-numbered-keys';
import purify from './utils/purify';
import createOriginalForPost from './utils/create-original-for-post';
import rel from './utils/rel';
import handlePostCaseFields from './handlers/cases/fields/post';
import handlePostOrganizationFields from './handlers/organizations/fields/post';
import handlePostUserFields from './handlers/users/fields/post';

// API Inconsistencies
//
// Collections are sometimes arrays and are named with a plural sometimes
// they are objects with numbered keys and are named singularly.
//
// businesshour is one word in teams but two in session resource
//
// resources in /view takes an array not an object
//
// identityDomain in resources the root of views/:id/cases is an object with numbered keys but
// when it is nested in organization it is an object in an array
//

const { isBlank } = Ember;

export default function() {
  this.passthrough('http://api.segment.io/**');

  // Endpoints
  this.get('/api/v1/locales/1', () => {
    return {
      status: 200,
      data: {
        id: 1,
        locale: 'en-us',
        name: 'English (United States)',
        native_name: 'English (United States)',
        region: 'US',
        native_region: 'United States',
        script: '',
        variant: '',
        direction: 'LTR',
        is_enabled: true,
        created_at: '2015-05-28T14:12:59Z',
        updated_at: '2015-05-28T14:12:59Z',
        strings: [],
        resource_type: 'locale'
      },
      resource: 'locale'
    };
  });

  this.post('/api/v1/users', function(schema, req) {
    const data = JSON.parse(req.requestBody);
    data.resource_type = 'user';
    data.is_enabled = true;
    data.tags = [];
    const user = schema.db.users.insert(data);
    return new Mirage.Response(201, {}, {
      status: 201,
      data: user,
      resource: user.resource_type
    });
  });

  this.post('/api/v1/identities/emails', function(schema, req) {
    const data = JSON.parse(req.requestBody);
    Reflect.deleteProperty(data, 'parent_id');
    Reflect.deleteProperty(data, 'parentType');

    data.resource_type = 'identity_email';
    const user = schema.db.users.find(data.user_id);
    const identity = schema.db.identityEmails.insert(data);
    schema.db.users.update(user.id, { emails: [identity].concat(user.emails) });
    return {
      status: 200,
      data: identity,
      resource: identity.resource_type
    };
  });
  this.post('/api/v1/identities/twitter', function(schema, req) {
    const data = JSON.parse(req.requestBody);
    Reflect.deleteProperty(data, 'parent_id');
    Reflect.deleteProperty(data, 'parentType');
    data.resource_type = 'identity_twitter';
    const user = schema.db.users.find(data.user_id);
    const identity = schema.db.identityTwitters.insert(data);
    schema.db.users.update(user.id, { twitter: [identity].concat(user.twitter) });
    return {
      status: 200,
      data: identity,
      resource: identity.resource_type
    };
  });
  this.post('/api/v1/identities/phones', function(schema, req) {
    const data = JSON.parse(req.requestBody);
    Reflect.deleteProperty(data, 'parent_id');
    Reflect.deleteProperty(data, 'parentType');
    data.resource_type = 'identity_phone';
    const user = schema.db.users.find(data.user_id);
    const identity = schema.db.identityPhones.insert(data);
    schema.db.users.update(user.id, { phones: [identity].concat(user.phones) });
    return {
      status: 200,
      data: identity,
      resource: identity.resource_type
    };
  });

  this.put('/api/v1/identities/emails/:id', function(schema, req) {
    const id = req.params.id;
    const attrs = JSON.parse(req.requestBody);
    const record = schema.db.identityEmails.update(id, attrs);

    return {
      status: 200,
      data: record,
      resource: 'identity_email'
    };
  });

  this.put('/api/v1/identities/emails/:id/send_verification_email', function(schema, req) {
    return {
      status: 200,
      notifications: [{
        type: 'INFO',
        message: 'An email has been sent to your email id',
        sticky: false
      }]
    };
  });

  this.post('/api/v1/identities/emails/:id/send_validation_email', function() {
    return { status: 200 };
  });

  this.put('/api/v1/identities/twitter/:id', function(schema, req) {
    const id = req.params.id;
    const attrs = JSON.parse(req.requestBody);
    const record = schema.db.identityTwitters.update(id, attrs);

    return {
      status: 200,
      data: record,
      resource: 'identity_twitter'
    };
  });

  this.put('/api/v1/identities/phones/:id', function(schema, req) {
    const id = req.params.id;
    const attrs = JSON.parse(req.requestBody);
    const record = schema.db.identityPhones.update(id, attrs);

    return {
      status: 200,
      data: record,
      resource: 'identity_phone'
    };
  });

  this.put('/api/v1/identities/facebook/:id', function(schema, req) {
    const id = req.params.id;
    const attrs = JSON.parse(req.requestBody);
    const record = schema.db.identityFacebooks.update(id, attrs);

    return {
      status: 200,
      data: record,
      resource: 'identity_facebook'
    };
  });

  this.delete('/api/v1/identities/emails/:id', function(schema, req) {
    schema.db.identityEmails.remove(req.params.id);
    return { status: 200 };
  });

  this.delete('/api/v1/identities/twitter/:id', function(schema, req) {
    schema.db.identityTwitters.remove(req.params.id);
    return { status: 200 };
  });

  this.delete('/api/v1/identities/phones/:id', function(schema, req) {
    schema.db.identityPhones.remove(req.params.id);
    return { status: 200 };
  });

  this.delete('/api/v1/identities/facebook/:id', function(schema, req) {
    schema.db.identityFacebooks.remove(req.params.id);
    return { status: 200 };
  });

  this.get('/api/v1/roles', (schema) => {
    return {
      status: 200,
      data: schema.db.roles,
      resource: 'role',
      offset: 0,
      limit: 10,
      total_count: schema.db.roles.length
    };
  });

  this.post('/api/v1/roles', (schema, req) => {
    const data = JSON.parse(req.requestBody);
    data.resource_type = 'role';
    Reflect.deleteProperty(data, 'permissions');
    let role = schema.db.roles.insert(data);

    return new Mirage.Response(201, {}, {
      status: 201,
      data: role,
      resource: role.resource_type
    });
  });

  this.put('/api/v1/roles/:id', (schema, req) => {
    const data = JSON.parse(req.requestBody);
    data.resource_type = 'role';
    const role = schema.db.roles.update(parseInt(req.params.id, 10), data);
    Reflect.deleteProperty(role, 'permissions');

    return new Mirage.Response(200, {}, {
      status: 200,
      data: role,
      resource: role.resource_type
    });
  });

  this.delete('/api/v1/roles/:id', (schema, req) => {
    schema.db.roles.remove(parseInt(req.params.id, 10));

    return new Mirage.Response(200, {}, {
      status: 200
    });
  });

  this.put('/api/v1/roles/:id/permissions', (schema, req) => {
    const data = JSON.parse(req.requestBody);
    const role = schema.db.roles.find(parseInt(req.params.id, 10));

    schema.db.permissions.clear();

    Object.keys(data.permission).forEach(function(name) {
      schema.db.permissions.insert({ name, role, value: data.permission[name] === 1 });
    });

    return new Mirage.Response(200, {}, {
      status: 200
    });
  });

  this.get('/api/v1/roles/:id', (schema, request) => {
    const role = schema.db.roles.find(request.params.id);
    Reflect.deleteProperty(role, 'permissions');

    return {
      status: 200,
      data: role,
      resource: 'role'
    };
  });

  this.get('/api/v1/roles/:id/permissions', (schema) => {
    return {
      status: 200,
      data: schema.db.permissions,
      resource: 'permission',
      offset: 0,
      limit: 10,
      total_count: schema.db.permissions.length
    };
  });

  this.get('/api/v1/me', (schema) => {
    const session = schema.db.sessions[0];

    return {
      status: 200,
      data: schema.db.users.find(session.user.id),
      resource: 'user',
      resources: {
        contact_address: arrayToObjectWithNumberedKeys(schema.db.contactAddresses),
        contact_website: arrayToObjectWithNumberedKeys(schema.db.contactWebsites),
        identity_domain: arrayToObjectWithNumberedKeys(schema.db.identityDomains),
        identity_email: arrayToObjectWithNumberedKeys(schema.db.identityEmails),
        identity_phone: arrayToObjectWithNumberedKeys(schema.db.identityPhones),
        identity_twitter: arrayToObjectWithNumberedKeys(schema.db.identityTwitters),
        identity_facebook: arrayToObjectWithNumberedKeys(schema.db.identityFacebooks),
        locale: arrayToObjectWithNumberedKeys(schema.db.locales),
        organization: arrayToObjectWithNumberedKeys(schema.db.organizations),
        organization_field: arrayToObjectWithNumberedKeys(schema.db.organizationFields),
        permission: arrayToObjectWithNumberedKeys(schema.db.permissions),
        role: arrayToObjectWithNumberedKeys(schema.db.roles),
        team: arrayToObjectWithNumberedKeys(schema.db.teams),
        user_field: arrayToObjectWithNumberedKeys(schema.db.userFields)
      }
    };
  });

  this.post('/admin/index.php', (schema) => {
    return {
      status: 200,
      data: {
        is_user: false
      }
    };
  });

  this.get('/api/v1/organizations', (schema) => {
    return {
      status: 200,
      data: schema.db.organizations,
      resource: 'organization',
      total_count: schema.db.organizations.length
    };
  });

  this.get('/api/v1/organizations/:id/members', () => {
    return new Mirage.Response(200, {}, organizationMembers);
  });

  // Monitors
  this.get('/api/v1/monitors', function(schema, req) {
    let monitors = schema.db.monitors;
    let predicateCollections = schema.db.monitors.reduce((accum, monitor) => {
      let collections = schema.db.predicateCollections.find(monitor.predicate_collections.mapBy('id'));
      return accum.concat(collections).uniq();
    }, []);
    let propositions = predicateCollections.reduce((accum, predColl) => {
      let propositions = schema.db.propositions.find(predColl.propositions.mapBy('id'));
      return accum.concat(propositions).uniq();
    }, []);
    let actions = schema.db.automationActions.find(
      monitors.reduce((accum, m) => accum.concat(m.actions.map(a => a.id)), [])
    );
    return {
      status: 200,
      data: monitors,
      resource: 'monitor',
      resources: {
        predicate_collection: arrayToObjectWithNumberedKeys(predicateCollections),
        proposition: arrayToObjectWithNumberedKeys(propositions),
        automation_action: arrayToObjectWithNumberedKeys(actions)
      }
    };
  });

  this.get('/api/v1/monitors/:id', function(schema, req) {
    let monitor = schema.db.monitors.find(req.params.id);
    let collections = schema.db.predicateCollections.find(monitor.predicate_collections.mapBy('id'));
    let propositions = collections.reduce((accum, c) => {
      let propositions = schema.db.propositions.find(c.propositions.mapBy('id'));
      return accum.concat(propositions).uniq();
    }, []);
    let actions = schema.db.automationActions.find(monitor.actions.map(e => e.id));
    return {
      status: 200,
      data: monitor,
      resource: 'monitor',
      resources: {
        predicate_collection: arrayToObjectWithNumberedKeys(collections),
        proposition: arrayToObjectWithNumberedKeys(propositions),
        automation_action: arrayToObjectWithNumberedKeys(actions)
      }
    };
  });

  this.post('/api/v1/monitors', function(schema, req) {
    let data = JSON.parse(req.requestBody);
    let propositions = [];
    let predicateCollections = data.predicate_collections.reduce((accum, collection) => {
      let collectionPropositions = collection.propositions.reduce((accum, proposition) => {
        return accum.concat([schema.db.propositions.insert(proposition)]);
      }, []);
      propositions.push(...collectionPropositions);
      collection.propositions = collectionPropositions.map(p => ({ id: p.id, resource_type: 'proposition' }));
      return accum.concat([schema.db.predicateCollections.insert(collection)]);
    }, []);
    let actions = data.actions.reduce((accum, data) => {
      data.attributes = Object.keys(data.attributes || {}).map(name => ({ name, value: data.attributes[name] }));
      return accum.concat(schema.db.automationActions.insert(data));
    }, []);
    let newMonitorAttrs = Object.assign(data, {
      predicate_collections: predicateCollections.map(c => ({ id: c.id, resource_type: 'predicate_collection' })),
      actions: actions.map(c => ({ id: c.id, resource_type: 'automation_action' }))
    });
    let monitor = schema.db.monitors.insert(newMonitorAttrs);
    return new Mirage.Response(201, {}, {
      status: 201,
      data: monitor,
      resource: 'monitor',
      resources: {
        predicate_collection: arrayToObjectWithNumberedKeys(predicateCollections),
        proposition: arrayToObjectWithNumberedKeys(propositions),
        automation_action: arrayToObjectWithNumberedKeys(actions)
      }
    });
  });

  this.put('/api/v1/monitors/:id', function(schema, req) {
    let data = JSON.parse(req.requestBody);
    let propositions = [];
    let monitor = schema.db.monitors.find(req.params.id);
    let savedPredicateCollections = monitor.predicate_collections;
    // Remove deleted predicate collections
    savedPredicateCollections.forEach(collection => {
      if (data.predicate_collections.mapBy('id').indexOf(collection.id) === -1) {
        schema.db.predicateCollections.remove(collection.id);
      }
    });

    // Create or update predicate collections
    let predicateCollections = data.predicate_collections.reduce((accum, collection) => {
      if (collection.id) {
        // ~~Update~~
        // This logic at the moment won't ever be executed because the smart diffing argorithm
        // created by Kirill deletes the existing records and replaces all predicate collections
        // with new ones with the same data. I won't delete it in case we make it smarter, but
        // it's not guaranteed to work.
        let savedCollection = schema.db.predicateCollections.find(collection.id);
        savedCollection.propositions.forEach(proposition => {
          if (collection.propositions.mapBy('id').indexOf(proposition.id) === -1) {
            // This proposition has been deleted
            schema.db.propositions.remove(proposition.id);
          }
        });
        let collectionPropositions = collection.propositions.reduce((accum, proposition) => {
          if (proposition.id) {
            let newAttrs = Object.assign({}, proposition);
            delete newAttrs.id;
            return accum.concat([schema.db.propositions.update(proposition.id, newAttrs)]);
          } else {
            return accum.concat([schema.db.propositions.insert(proposition)]);
          }
        }, []);
        propositions.push(...collectionPropositions);
        let predicateCollection = schema.db.predicateCollections.update(collection.id, {
          propositions: collectionPropositions.map(p => ({ id: p.id, resource_type: 'proposition' }))
        });
        return accum.concat([predicateCollection]);
      } else {
        // ~~Create~~
        let collectionPropositions = collection.propositions.reduce((accum, proposition) => {
          proposition.resource_type = 'proposition';
          return accum.concat([schema.db.propositions.insert(proposition)]);
        }, []);
        propositions.push(...collectionPropositions);
        let predicateCollection = schema.db.predicateCollections.insert({
          resource_type: 'predicate_collection',
          propositions: collectionPropositions.map(p => ({ id: p.id, resource_type: 'proposition' }))
        });
        return accum.concat([predicateCollection]);
      }
    }, []);

    // Create or update actions
    let actions = data.actions.reduce((accum, data) => {
      let actionId = data.id;
      delete data.id;
      data.attributes = Object.keys(data.attributes || {}).map(name => ({ name, value: data.attributes[name] }));
      if (actionId) {
        // ~~Update~~
        return accum.concat([schema.db.automationActions.insert(actionId, data)]);
      } else {
        // ~~Create~~
        return accum.concat([schema.db.automationActions.insert(data)]);
      }

    }, []);
    // Update the monitor
    let newMonitorAttrs = Object.assign(data, {
      predicate_collections: predicateCollections.map(c => ({ id: c.id, resource_type: 'predicate_collection' })),
      actions: actions.map(c => ({ id: c.id, resource_type: 'automation_action' }))
    });
    delete newMonitorAttrs.id;
    monitor = schema.db.monitors.update(req.params.id, newMonitorAttrs);
    return {
      status: 200,
      data: monitor,
      resource: 'monitor',
      resources: {
        predicate_collection: arrayToObjectWithNumberedKeys(predicateCollections),
        proposition: arrayToObjectWithNumberedKeys(propositions),
        automation_action: arrayToObjectWithNumberedKeys(actions)
      }
    };
  });

  this.delete('/api/v1/monitors/:id', function(schema, req) {
    schema.db.monitors.remove(req.params.id);
    return { status: 200 };
  });

  this.put('/api/v1/monitors/reorder', function(schema, req) {
    let data = JSON.parse(req.requestBody);
    let monitors = schema.db.monitors.find(data.monitor_ids);
    monitors.forEach((monitor, idx) => schema.db.monitors.update(monitor.id, { execution_order: idx + 1 }));
    return {
      status: 200,
      data: schema.db.monitors.find(data.monitor_ids),
      resource: 'monitor',
      resources: {}
    };
  });

  this.get('/api/v1/users/definitions', (schema, request) => {
    return {
      status: 200,
      data: schema.db.definitions.filterBy('_mirage_group', 'USER'),
      resource: 'definition',
      total_count: schema.db.definitions.filterBy('_mirage_group', 'USER').length
    };
  });

  this.post('/api/v1/users/filter', (schema, request) => {
    return new Mirage.Response(201, {}, {
      status: 201,
      data: schema.db.users,
      resource: 'user',
      resources: gatherSideloadedResources(schema.db, schema.db.users),
      total_count: schema.db.users.length
    });
  });

  this.get('/api/v1/monitors/definitions', (schema, request) => {
    return {
      status: 200,
      data: schema.db.definitions,
      resource: 'definition',
      total_count: schema.db.definitions.length
    };
  });

  // Automation Action Definitions
  this.get('/api/v1/monitors/actions/definitions', (schema, request) => {
    return {
      status: 200,
      data: schema.db.automationActionDefinitions,
      resource: 'automation_action_definition',
      total_count: schema.db.automationActionDefinitions.length
    };
  });

  // Organizations
  this.post('/api/v1/organizations', (schema, req) => {
    const data = JSON.parse(req.requestBody);
    data.resource_type = 'organization';
    data.tags = [];
    data.custom_fields = [];
    let domains = [data.domains].map(domain => {
      return schema.db.identityDomains.insert({ domain: domain, resource_type: 'identity_domain', is_primary: true });
    });
    data.domains = domains.mapBy('id');
    const organization = schema.db.organizations.insert(data);
    return new Mirage.Response(201, {}, {
      status: 201,
      data: organization,
      resource: data.resource_type,
      resources: {
        identity_domain: arrayToObjectWithNumberedKeys(domains)
      }
    });
  });

  this.get('/api/v1/views/:id', (schema, req) => {
    let view = schema.db.views.find(req.params.id);

    if (view.columns) {
      view.columns.forEach((column) => {
        Reflect.deleteProperty(column, 'id');
      });
    }
    let predicateCollections = schema.db.predicateCollections
      .find(view.predicate_collections.map(e => e.id))
      .map(e => {
        return { id: e.id, propositions: e.propositions, resource_type: e.resource_type };
      });
    let propositionIds = predicateCollections.reduce((ary, pc) => ary.concat(pc.propositions.mapBy('id')), []);
    let propositions = schema.db.propositions.find(propositionIds);

    return {
      data: view,
      resource: 'view',
      status: 200,
      resources: {
        predicate_collection: arrayToObjectWithNumberedKeys(predicateCollections),
        proposition: arrayToObjectWithNumberedKeys(propositions)
      }
    };
  });

  this.get('/api/v1/views', (schema) => {
    let views = schema.db.views;
    if (views) {
      views.forEach((view) => {
        if (view.columns) {
          view.columns.forEach((column) => {
            Reflect.deleteProperty(column, 'id');
          });
        }
      });
    }

    let predicateCollections = schema.db.predicateCollections.map(e => {
      return { id: e.id, propositions: e.propositions, resource_type: e.resource_type };
    });

    return {
      data: views,
      limit: 10,
      offset: 0,
      resource: 'view',
      resources: {
        predicate_collection: arrayToObjectWithNumberedKeys(predicateCollections),
        propositions: arrayToObjectWithNumberedKeys(schema.db.propositions)
      },
      status: 200,
      total_count: schema.db.views.length
    };
  });

  this.post('/api/v1/views', (schema, request) => {
    const requestData = JSON.parse(request.requestBody);
    let columnsResponseData = [];

    requestData.columns = requestData.columns.forEach(column => {
      columnsResponseData.push({
        name: column,
        resource_type: 'column'
      });
    });

    requestData.predicate_collections = requestData.predicate_collections.map(collection => {
      let propositions = collection.propositions.map(proposition => {
        return schema.db.propositions.insert({
          field: proposition.field,
          operator: proposition.operator.key,
          value: proposition.value,
          resource_type: 'proposition'
        });
      });

      const responseData = schema.db.predicateCollections.insert({
        propositions,
        resource_type: 'predicate_collection'
      });

      return {
        id: responseData.id,
        resource_type: 'predicate_collection'
      };
    });

    if (requestData.team_ids) {
      requestData.visibility_to_teams = requestData.team_ids.map(id => ({ id, resource_type: 'team' }));
    }
    Reflect.deleteProperty(requestData, 'team_ids');
    requestData.resource_type = 'view';
    let responseData = schema.db.views.insert(requestData);
    let predicateCollections = schema.db.predicateCollections.map(e => {
      return { id: e.id, propositions: e.propositions, resource_type: 'predicate_collection' };
    });

    let payload = {
      status: 201,
      data: responseData,
      resource: 'view',
      resources: {
        role: arrayToObjectWithNumberedKeys(schema.db.roles),
        team: arrayToObjectWithNumberedKeys(schema.db.teams),
        user: arrayToObjectWithNumberedKeys(schema.db.users),
        user_field: arrayToObjectWithNumberedKeys(schema.db.userFields),
        predicate_collection: arrayToObjectWithNumberedKeys(predicateCollections),
        propositions: arrayToObjectWithNumberedKeys(schema.db.propositions),
        organization_field: arrayToObjectWithNumberedKeys(schema.db.organizationFields),
        organization: arrayToObjectWithNumberedKeys(schema.db.organizations),
        identity_email: arrayToObjectWithNumberedKeys(schema.db.identityEmails),
        business_hour: arrayToObjectWithNumberedKeys(schema.db.businessHours),
        identity_domain: arrayToObjectWithNumberedKeys(schema.db.identityDomains)
      }
    };
    return new Mirage.Response(201, {}, payload);
  });

  this.get('/api/v1/credentials', () => {
    return {
      status: 200,
      data: {
        realtime_app_key: 'realtime_app_key',
        realtime_chat_app_key: 'realtime_chat_app_key'
      },
      resource: 'credential',
      resources: {}
    };
  });

  this.get('/api/v1/views/definitions', (schema) => {
    return {
      data: schema.db.definitions,
      resource: 'definition',
      status: 200,
      total_count: schema.db.definitions.length
    };
  });

  this.get('/api/v1/views/columns', (schema) => {
    return {
      data: schema.db.columns,
      status: 200,
      resource: 'column',
      total_count: schema.db.columns.length
    };
  });

  this.get('/api/v1/views/counts', (schema) => {
    return {
      data: schema.db.viewCounts,
      status: 200,
      resource: 'view-count',
      total_count: 0
    };
  });

  this.put('/api/v1/base/profile/password', (schema, request) => {
    let split = request.requestBody.split('=');
    let newPassword = split[2];
    let oldPassword = split[1].split('&')[0];

    if (oldPassword === newPassword) {
      return new Mirage.Response(400, {}, {
        status: 400,
        errors: [
          {
            code: 'FIELD_INVALID',
            parameter: 'new_password',
            message: 'The value of the field is invalid',
            more_info: 'http://wiki.kayako.com/display/DEV/REST+v1+-+FIELD_INVALID'
          }
        ],
        notifications: [
          {
            type: 'ERROR',
            message: 'You cannot reuse an old password, please specify a new password',
            sticky: false
          }
        ]
      });
    }

    const session = schema.db.sessions[0];
    return {
      status: 200,
      session_id: session.id
    };
  });

  this.get('/api/v1/session', (schema, request) => {
    // otp@kayako.com : setup
    if (request.requestHeaders.Authorization === 'Basic b3RwQGtheWFrby5jb206c2V0dXA=') {
      let response = {
        data: {},
        status: 403,
        errors: [{
          code: 'OTP_EXPECTED',
          message: 'To complete logging in you need to provide the one-time password'
        }],
        notifications: [{
          type: 'INFO',
          message: 'Two-factor authentication is enabled for your account',
          related_href: 'https://developer.kayakostage.net/api/v1/users/two_factor/',
          sticky: true
        }],
        auth_token: 'PsAH0Jx27MrhLGiDelvlkGOo8olKL6AyEWdvwK665kjjxuUwMJun6ZyHZ9Z'
      };
      return new Mirage.Response(403, {}, response);
    }

    // reset@kayako.com : longpass
    if (request.requestHeaders.Authorization === 'Basic cmVzZXRAa2F5YWtvLmNvbTpsb25ncGFzcw==') {
      let response = {
        data: {},
        status: 403,
        errors: [{
          code: 'CREDENTIAL_EXPIRED',
          message: 'The credential (e.g. password) is valid but has expired'
        }],
        auth_token: 'PsAH0Jx27MrhLGiDelvlkGOo8olKL6AyEWdvwK665kjjxuUwMJun6ZyHZ9Z'
      };
      return new Mirage.Response(403, {}, response);
    }

    // invalid@kayako.com : invalid
    if (request.requestHeaders.Authorization === 'Basic aW52YWxpZEBrYXlha28uY29tOmludmFsaWQ=') {
      let response = {
        status: 401,
        errors: [
          {
            code: 'AUTHENTICATION_FAILED',
            message: 'Used authentication credentials are invalid or signature verification failed',
            more_info: 'https://developer.kayako.com/api/v1/reference/errors/AUTHENTICATION_FAILED'
          }
        ]
      };
      return new Mirage.Response(401, {}, response);
    }

    let session = schema.db.sessions[0];
    const CSRF_TOKEN = 'a-csrf-token';

    if (request.requestHeaders['X-OTP']) {
      if (request.requestHeaders['X-OTP'] === '666') {
        return new Mirage.Response(401, {}, {
          status: 401,
          errors: [{
            code: 'AUTHENTICATION_FAILED',
            message: 'Used authentication credentials are invalid or signature verification failed',
            more_info: 'http://wiki.kayako.com/display/DEV/REST+v1+-+AUTHENTICATION_FAILED'
          }]
        });
      }

      return new Mirage.Response(200, {
        'X-CSRF-Token': CSRF_TOKEN
      }, {
        session_id: session.id,
        status: 200
      });
    }

    // valid@kayako.com : valid
    if (request.requestHeaders.Authorization === 'Basic bWFpbkBrYXlha28uY29tOnZhbGlk'
      || request.requestHeaders['X-Impersonation-Token'] === '456D626572207375636B73') {
      const user = schema.db.users[0];
      session = server.create('session', { user: { id: user.id, resource_type: 'user' }});
    }

    return new Mirage.Response(200, {
      'X-CSRF-Token': CSRF_TOKEN
    }, {
      status: 200,
      data: session,
      resource: 'session',
      resources: {
        business_hour: arrayToObjectWithNumberedKeys(schema.db.businessHours),
        field_option: arrayToObjectWithNumberedKeys(schema.db.fieldOptions),
        contact_address: arrayToObjectWithNumberedKeys(schema.db.contactAddresses),
        contact_website: arrayToObjectWithNumberedKeys(schema.db.contactWebsites),
        identity_domain: arrayToObjectWithNumberedKeys(schema.db.identityDomains),
        identity_email: arrayToObjectWithNumberedKeys(schema.db.identityEmails),
        identity_phone: arrayToObjectWithNumberedKeys(schema.db.identityPhones),
        identity_twitter: arrayToObjectWithNumberedKeys(schema.db.identityTwitters),
        identity_facebook: arrayToObjectWithNumberedKeys(schema.db.identityFacebooks),
        locale: arrayToObjectWithNumberedKeys(schema.db.locales),
        organization: arrayToObjectWithNumberedKeys(schema.db.organizations),
        role: arrayToObjectWithNumberedKeys(schema.db.roles),
        team: arrayToObjectWithNumberedKeys(schema.db.teams),
        user: arrayToObjectWithNumberedKeys([schema.db.users.find(session.user.id)]),
        user_field: arrayToObjectWithNumberedKeys(schema.db.userFields)
      }
    });
  });

  this.get('/api/v1/teams', ({ db: { teams } }, { queryParams }) => {
    let offset = +queryParams.offset || 0;
    let limit = +queryParams.limit || 10;

    teams = teams.slice(offset, offset + limit);

    return {
      status: 200,
      resource: 'team',
      data: teams,
      offset,
      limit,
      total_count: teams.length
    };
  });

  this.post('/api/v1/teams', (schema, { requestBody }) => {
    let attrs = normalizeTeamAttrs(JSON.parse(requestBody));
    let team = server.create('team', attrs);

    return {
      status: 201,
      resource: 'team',
      data: team
    };
  });

  this.get('/api/v1/teams/:id', ({ db: { teams } }, { params: { id } }) => {
    let team = teams.find(id);

    return {
      status: 200,
      resource: 'team',
      data: team
    };
  });

  this.put('/api/v1/teams/:id', ({ db: { teams } }, { params: { id }, requestBody }) => {
    let attrs = normalizeTeamAttrs(JSON.parse(requestBody));
    let team = teams.update(id, attrs);

    return {
      status: 200,
      resource: 'team',
      data: team
    };
  });

  this.get('/api/v1/teams/:id/members', ({ db: { users } }, { params: { id }, queryParams }) => {
    let offset = +queryParams.offset || 0;
    let limit = +queryParams.limit || 10;
    let members = users.filter(user => user.teams.findBy('id', id));

    members = members.slice(offset, offset + limit);

    return {
      status: 200,
      resource: 'user',
      data: members,
      offset,
      limit,
      total_count: members.length
    };
  });

  this.post('/api/v1/teams/:id/members', ({ db: { teams, users } }, { params: { id }, requestBody }) => {
    let ids = JSON.parse(requestBody).agent_ids.split(',');
    let newMembers = users.find(ids);

    newMembers.forEach(user => {
      if (user.teams.findBy('id', id)) { return; }
      users.update(user.id, { teams: [...user.teams, { id, resource_type: 'team' }] });
    });

    let members = users.filter(user => user.teams.findBy('id', id));

    teams.update(id, { member_count: members.length });

    return {
      status: 200,
      resource: 'user',
      data: members,
      total_count: members.length
    };
  });

  this.delete('/api/v1/teams/:id/members', ({ db: { teams, users } }, { params: { id }, queryParams }) => {
    let ids = queryParams.agent_ids.split(',');
    let exMembers = users.find(ids);

    exMembers.forEach(user => {
      users.update(user.id, { teams: user.teams.filter(team => team.id !== id) });
    });

    let members = users.filter(user => user.teams.findBy('id', id));

    teams.update(id, { member_count: members.length });

    return {
      status: 200,
      total_count: members.length
    };
  });

  this.get('/api/v1/users', (schema, req) => {
    const flatMode = req.queryParams._flat === 'false';
    const fields = req.queryParams.fields ? req.queryParams.fields.split(',') : [];
    const offset = parseInt(req.queryParams.offset || 0, 10);
    const limit = parseInt(req.queryParams.limit, 10);
    const users = schema.db.users.slice(offset, offset + limit);

    let usersList = users;
    if (flatMode) {
      usersList = users.map(user => {
        let limitedUser = {};

        Object.keys(user).forEach((key) => {
          if (fields.indexOf(Ember.String.camelize(key)) > -1) {
            limitedUser[key] = user[key];
          }
        });

        return limitedUser;
      });
    }

    return {
      status: 200,
      data: usersList,
      resource: 'user',
      limit: 10,
      offset: 0,
      resources: {
        business_hour: arrayToObjectWithNumberedKeys(schema.db.businessHours),
        field_option: arrayToObjectWithNumberedKeys(schema.db.fieldOptions),
        identity_email: arrayToObjectWithNumberedKeys(users.reduce((ary, u) => ary.concat(u.emails), [])),
        identity_twitter: arrayToObjectWithNumberedKeys(users.reduce((ary, u) => ary.concat(u.twitter), [])),
        identity_phone: arrayToObjectWithNumberedKeys(users.reduce((ary, u) => ary.concat(u.phones), [])),
        identity_facebook: arrayToObjectWithNumberedKeys(users.reduce((ary, u) => ary.concat(u.facebook), [])),
        role: arrayToObjectWithNumberedKeys(users.reduce((ary, u) => ary.concat([u.role]), [])),
        team: arrayToObjectWithNumberedKeys(users.reduce((ary, u) => ary.concat(u.teams), [])),
        user_field: arrayToObjectWithNumberedKeys(schema.db.userFields)
      },
      total_count: users.length
    };
  });

  this.get('/api/v1/users/:id', (schema, request) => {
    let id = request.params.id;

    return {
      status: 200,
      data: schema.db.users.find(id),
      resource: 'user',
      limit: 10,
      offset: 0,
      resources: {
        business_hour: arrayToObjectWithNumberedKeys(schema.db.businessHours),
        field_option: arrayToObjectWithNumberedKeys(schema.db.fieldOptions),
        identity_phone: arrayToObjectWithNumberedKeys(schema.db.identityPhones),
        identity_email: arrayToObjectWithNumberedKeys(schema.db.identityEmails),
        identity_facebook: arrayToObjectWithNumberedKeys(schema.db.identityFacebooks),
        identity_twitter: arrayToObjectWithNumberedKeys(schema.db.identityTwitters),
        role: arrayToObjectWithNumberedKeys(schema.db.roles),
        team: arrayToObjectWithNumberedKeys(schema.db.teams),
        user_field: arrayToObjectWithNumberedKeys(schema.db.userFields),
        locale_field: arrayToObjectWithNumberedKeys(schema.db.localeFields)
      },
      total_count: schema.db.users.length
    };
  });

  this.put('/api/v1/users/:id', (schema, request) => {
    let id = request.params.id;
    let data = JSON.parse(request.requestBody);
    let errors = [];
    let role = schema.db.roles.find(data.role_id);

    if (role && role.type === 'AGENT') {
      if (isBlank(data.team_ids)) {
        errors.push({
          'code': 'FIELD_EMPTY',
          'parameter': 'team_ids',
          'message': 'The value of the field cannot be empty'
        });
      }
      if (isBlank(data.agent_case_access)) {
        errors.push({
          'code': 'FIELD_EMPTY',
          'parameter': 'agent_case_access',
          'message': 'The value of the field cannot be empty'
        });
      }
    }

    if (errors.length > 0) {
      return new Mirage.Response(400, {}, { status: 400, errors });
    }

    let tagNames = String(data.tags).split(',').filter(name => !isBlank(name));
    data.tags = tagNames.map(name => {
      let tag = schema.db.tags.where({ name })[0];
      if (!tag) {
        tag = schema.db.tags.insert({ name });
      }
      return tag;
    });

    let responseData = schema.db.users.update(id, data);

    responseData.role = role;

    return {
      status: 200,
      data: responseData,
      resource: 'user'
    };
  });

  this.get('/api/v1/users/:id/avatar', () => {
    return {
      status: 200,
      data: {
        id: 1,
        data: '',
        type: 'jpeg',
        url: '',
        created_at: new Date(),
        updated_at: new Date(),
        resource_type: 'avatar'
      },
      resources: [],
      resource: 'avatar'
    }
  });

  this.put('/api/v1/organizations/:id', (schema, request) => {
    let id = request.params.id;
    let data = JSON.parse(request.requestBody);
    data.updated_at = new Date();
    let domainNames = data.domains.split(',');
    let errors = [];
    if (domainNames.length > 0) {
      let orgsWithSameDomain = schema.db.organizations.where(function(org) {
        if (org.id.toString() === id) { return false; }
        let orgDomains = schema.db.identityDomains.find(org.domains.map(o => o.id));
        return orgDomains.some(d => domainNames.indexOf(d.domain) > -1);
      });

      if (orgsWithSameDomain.length > 0) {
        errors.push({
          'code': 'FIELD_DUPLICATE',
          'parameter': 'domains',
          'message': 'There is another organiation with the same domain'
        });
      }
    }
    if (errors.length > 0) {
      return new Mirage.Response(400, {}, { status: 400, errors });
    }

    data.domains = domainNames.reduce((accum, name) => {
      return accum.concat(schema.db.identityDomains.where({ domain: name }));
    }, []);

    let responseData = schema.db.organizations.update(id, data);

    responseData.tags = [];
    responseData.addresses = [];
    responseData.is_validated = null;
    responseData.websites = [];
    responseData.domains = [];

    delete responseData.followers;
    delete responseData.brand_id;
    delete responseData.pinned;
    delete responseData.tags;
    delete responseData.field_values;

    return {
      status: 200,
      data: responseData,
      resource: 'organization'
    };
  });

  this.get('/api/v1/users/:id/cases', (schema, request) => {
    let { id } = request.params;
    let offset = parseInt(request.queryParams.offset, 10) || 0;
    let limit = parseInt(request.queryParams.limit, 10) || 10;
    let data = schema.db.cases
      .filter(c => c.requester.id === id)
      .slice(offset, offset + limit);
    let resources = gatherSideloadedResources(schema, data);

    return {
      status: 200,
      resource: 'case',
      data,
      resources,
      limit,
      offset,
      total_count: data.length
    };
  });

  this.get('/api/v1/users/:id/notes', (schema, request) => {
    return {
      status: 200,
      data: schema.db.notes,
      resource: 'note'
    };
  });

  this.get('/api/v1/organizations/:id/notes', (schema, request) => {
    return {
      status: 200,
      data: schema.db.notes,
      resource: 'note'
    };
  });

  this.get('/api/v1/organizations/:id/members', (schema, request) => {
    return {
      status: 200,
      data: [],
      resource: 'user'
    };
  });

  this.delete('/api/v1/session', () => {
    return {
      status: 200
    };
  });

  this.post('/api/v1/base/password/reset', () => {
    return {
      status: 200,
      auth_token: 'yh5wFffnVzOi5IyYr1aMwojpcRJw0FGid3S9r5iDumvLsPI0fRWBl4VfTEpPkodWwUvLlQXr3zJkfTxC'
    };
  });


  this.get('/api/v1/cases/forms/:id', (schema, request) => {
    let id = request.params.id;

    return {
      status: 200,
      data: schema.db.caseForms.find(id),
      resource: 'case_form',
      resources: {}
    };
  });

  this.get('/api/v1/cases/forms', (schema) => {
    return {
      data: schema.db.caseForms,
      resource: 'case_form',
      resources: {
        brand: arrayToObjectWithNumberedKeys(schema.db.brands),
        case_field: arrayToObjectWithNumberedKeys(schema.db.caseFields),
        field_option: arrayToObjectWithNumberedKeys(schema.db.fieldOptions),
        locale: arrayToObjectWithNumberedKeys(schema.db.locales)
      },
      status: 200,
      total_count: schema.db.caseForms.length
    };
  });

  this.post('/api/v1/cases/forms', (schema, request) => {
    const requestData = JSON.parse(request.requestBody);

    const newCustomerTitles = [];
    const customerTitles = requestData.customer_titles;
    Reflect.deleteProperty(requestData, 'customer_titles');
    if (customerTitles) {
      customerTitles.forEach((customerTitle) => {
        const newField = schema.db.localeFields.insert(customerTitle);
        newCustomerTitles.push({ id: newField.id, resource_type: 'locale_field' });
      });
    }

    const newDescriptions = [];
    const descriptions = requestData.descriptions;
    Reflect.deleteProperty(requestData, 'descriptions');
    if (descriptions) {
      descriptions.forEach((description) => {
        const newField = schema.db.localeFields.insert(description);
        newDescriptions.push({ id: newField.id, resource_type: 'locale_field' });
      });
    }

    let responseData = schema.db.caseForms.insert(requestData);
    responseData.is_enabled = true;

    responseData.customer_titles = newCustomerTitles;
    responseData.descriptions = newDescriptions;

    responseData.resource_type = 'case_form';
    let payload = {
      status: 201,
      data: responseData,
      resource: 'case_form',
      resources: {
        locale_field: arrayToObjectWithNumberedKeys(schema.db.localeFields)
      }
    };
    return new Mirage.Response(201, {}, payload);
  });

  this.put('/api/v1/cases/forms/default', (schema, request) => {
    const requestData = JSON.parse(request.requestBody);

    let caseForm = schema.db.caseForms.find(requestData.form_id);
    caseForm.is_default = true;

    let responseData = schema.db.caseForms.update(requestData.form_id, caseForm);

    responseData.resource_type = 'case_form';
    let payload = {
      status: 200,
      data: responseData,
      resource: 'case_form',
      resources: []
    };
    return new Mirage.Response(200, {}, payload);
  });

  this.put('/api/v1/cases/forms/:id', (schema, request) => {
    const requestData = JSON.parse(request.requestBody);
    let responseData = schema.db.caseForms.update(request.params.id, requestData);

    responseData.resource_type = 'case_form';
    let payload = {
      status: 200,
      data: responseData,
      resource: 'case_form',
      resources: []
    };
    return new Mirage.Response(200, {}, payload);
  });

  this.delete('/api/v1/cases/forms/:id', (schema, request) => {
    schema.db.caseForms.remove(request.params.id);

    let payload = {
      status: 200
    };
    return new Mirage.Response(200, {}, payload);
  });

  this.get('/api/v1/cases/channels', (schema, request) => {
    let data = schema.db.channels;
    let resources = gatherSideloadedResources(schema, data);

    return {
      status: 200,
      resource: 'channel',
      data,
      resources
    };
  });

  this.get('/api/v1/views/:id/cases', (schema, request) => {
    let view = schema.db.views.find(request.params.id);
    let cases = schema.db.cases.where(c => c._view_ids.includes(request.params.id));
    let { order_by_column: orderByColumn, order_by: orderBy, limit, offset } = request.queryParams;
    limit = parseInt(limit || 1000000, 10);
    offset = parseInt(offset || 0, 10);

    orderByColumn = orderByColumn || view.order_by_column;
    orderBy = orderBy || (view.order_by ? view.order_by.toLowerCase() : null);

    if (orderByColumn === 'caseid') {
      orderByColumn = 'id';
    }

    if (orderBy && orderByColumn) {
      cases = cases.sort((a, b) => {
        let valueA = typeof a[orderByColumn] === 'string' ? parseInt(a[orderByColumn]) || a[orderByColumn] : a[orderByColumn];
        let valueB = typeof b[orderByColumn] === 'string' ? parseInt(b[orderByColumn]) || b[orderByColumn] : b[orderByColumn];
        return Ember.compare(valueA, valueB);
      });

      if (orderBy === 'desc') {
        cases = cases.reverse();
      }
    }

    let data = cases.slice(offset, offset + limit);
    let resources = gatherSideloadedResources(schema.db, data);

    return {
      status: 200,
      resource: 'case',
      data,
      resources,
      offset,
      limit,
      total_count: schema.db.cases.length
    };
  });

  this.get('/api/v1/cases/:id/posts', (schema, req) => {
    let caseId = req.params.id;
    let kase = schema.db.cases.find(caseId);
    let userId = kase.requester.id;
    let organizationId = schema.db.users.find(userId).organization ? schema.db.users.find(userId).organization.id : 0;
    let posts = schema.db.posts.where((record) => {
      return record.case_id === caseId ||
        (record.original && record.original.object && record.original.object.id === userId && record.source_channel && record.source_channel.type === 'NOTE') ||
        (record.original && record.original.object && record.original.object.id === organizationId && record.source_channel && record.source_channel.type === 'NOTE');
    }).sortBy('created_at').reverse();

    if (!posts.length) {
      return {
        data: [],
        resource: 'post',
        resources: {},
        status: 200,
        total_count: 0
      };
    }

    //The API has before and after round the wrong way
    let afterId = req.queryParams.before_id;
    let beforeId = req.queryParams.after_id;

    if (beforeId && afterId) {
      return { status: 500 };
    }

    let limit = req.queryParams.limit || 10;
    let filters = req.queryParams.filters;

    let data;

    if (!beforeId && !afterId) {
      data = posts.sortBy('sequence').reverse().slice(0, limit);
    }

    if ( beforeId ) {
      let beforePostPosition = posts.find((post) => { return post.id === beforeId }).sequence - 1;
      data = posts.sortBy('sequence').slice(Math.max(0, beforePostPosition - limit), beforePostPosition).reverse();
    }

    if ( afterId ) {
      let afterPostPosition = posts.find((post) => { return post.id === afterId }).sequence;
      data = posts.sortBy('sequence').slice(afterPostPosition, afterPostPosition + +limit).reverse();
    }

    let resources = gatherSideloadedResources(schema.db, posts);

    return {
      data: data,
      resource: 'post',
      resources,
      status: 200,
      total_count: posts.length
    };
  });

  ['user', 'organization'].forEach(type => {
  //['/api/v1/cases/:id/posts', '/api/v1/users/:id/posts', '/api/v1/organizations/:id/posts'].forEach(url => {
    this.get(`/api/v1/${type}s/:id/posts`, (schema, req) => {
      let id = req.params.id;

      let field = `${type}_id`;

      let allPosts = schema.db.posts.where({ [field]: id }).sortBy('created_at').reverse();
      let limit = (req.queryParams.limit && +req.queryParams.limit) || 10;
      let beforeId = req.queryParams.before_id && +req.queryParams.before_id;
      let afterId = req.queryParams.after_id && +req.queryParams.after_id;
      let data = [];

      if (!beforeId && !afterId) {
        data = allPosts.slice(0, limit);
      }

      if (beforeId) {
        let i = allPosts.findIndex(element => +element.id === beforeId);
        if (i > 0) {
          data = allPosts.slice(0, i);
        }
      }

      if (afterId) {
        let i = allPosts.findIndex(element => +element.id === afterId);
        if (i > 0) {
          let start = i + 1;
          let end = start + limit;
          data = allPosts.slice(start, end);
        }
      }

      return {
        data,
        limit,
        resource: 'post',
        resources: {
          brand: arrayToObjectWithNumberedKeys(schema.db.brands),
          attachments: arrayToObjectWithNumberedKeys(schema.db.attachments),
          case_message: arrayToObjectWithNumberedKeys(schema.db.caseMessages),
          identity_domain: arrayToObjectWithNumberedKeys(schema.db.identityDomains),
          identity_email: arrayToObjectWithNumberedKeys(schema.db.identityEmails),
          identity_phone: arrayToObjectWithNumberedKeys(schema.db.identityPhones),
          locale: arrayToObjectWithNumberedKeys(schema.db.locales),
          mailbox: arrayToObjectWithNumberedKeys(schema.db.mailboxes),
          message_recipient: arrayToObjectWithNumberedKeys(schema.db.messageRecipients),
          organization: arrayToObjectWithNumberedKeys(schema.db.organizations),
          role: arrayToObjectWithNumberedKeys(schema.db.roles),
          user: arrayToObjectWithNumberedKeys(schema.db.users),
          note: arrayToObjectWithNumberedKeys(schema.db.notes),
          twitter_tweet: arrayToObjectWithNumberedKeys(schema.db.twitterTweets),
          channel: arrayToObjectWithNumberedKeys(schema.db.channels)
        },
        status: 200,
        total_count: schema.db.posts.where({ [field]: id }).length
      };
    });
  });

  this.get('/api/v1/users/:case_id/posts/:post_id', (schema, req) => {
    const post = schema.db.posts.find(req.params.post_id);

    return {
      status: 200,
      data: post,
      resource: 'post',
      resources: {}
    };
  });

  this.get('/api/v1/organizations/:case_id/posts/:post_id', (schema, req) => {
    const post = schema.db.posts.find(req.params.post_id);

    return {
      status: 200,
      data: post,
      resource: 'post',
      resources: {}
    };
  });

  this.put('/api/v1/cases', (schema, request) => {
    return {
      status: 200,
      total_count: 1
    };
  });

  this.post('/api/v1/cases', (schema, req) => {
    let data = JSON.parse(req.requestBody);
    data.tags = data.tags.split(',').map(name => schema.db.tags.where({ name })[0]).compact();

    data.status = {
      id: data.status_id,
      resource_type: 'case_status'
    };
    Reflect.deleteProperty(data, 'status_id');

    data.requester = {
      id: data.requester_id,
      resource_type: 'user'
    };
    Reflect.deleteProperty(data, 'requester_id');
    let theCase = server.create('case', data);
    return new Mirage.Response(201, {}, {
      status: 201,
      resource: 'case',
      data: theCase,
      resources: {
        case_status: arrayToObjectWithNumberedKeys(schema.db.caseStatuses.filterBy('id', data.status.id)),
        user: arrayToObjectWithNumberedKeys(schema.db.users.filterBy('id', data.requester.id))
      }
    });
  });

  this.put('/api/v1/cases/:id/trash', (schema, req) => {
    return {
      status: 200,
      resource: 'case',
      data: schema.db.cases.update(req.params.id, {state: 'TRASH'})
    };
  });

  this.put('/api/v1/cases/:id/restore', (schema, req) => {
    return {
      status: 200,
      resource: 'case',
      data: schema.db.cases.update(req.params.id, {state: 'ACTIVE'})
    };
  });

  this.put('/api/v1/cases/:id', (schema, req) => {
    let body = JSON.parse(req.requestBody);
    let tags = String(body.tags).split(',');
    Reflect.deleteProperty(body, 'tags');
    tags.forEach(tag => {
      if (!schema.db.tags.where({ name: tag })[0]) {
        schema.db.tags.insert({ name: tag });
      }
    });
    let targetCase = schema.db.cases.update(req.params.id, body);
    Reflect.deleteProperty(targetCase, 'reply_channels');
    return {
      status: 200,
      resource: 'case',
      data: targetCase
    };
  });

  this.get('/api/v1/cases/:id', (schema, request) => {
    if (isNaN(request.params.id)) {
      throw Error('Caught by a wild card!');
    }
    const id = parseInt(request.params.id);
    let theCase = schema.db.cases.find(id);
    let resources = gatherSideloadedResources(schema.db, theCase);
    return {
      status: 200,
      data: theCase,
      resource: 'case',
      resources
    };
  });

  this.get('/api/v1/cases/:id/notes', (schema) => {
    return schema.db.notes;
  });

  ['user', 'organization'].forEach(type => {
    this.post(`/api/v1/${type}s/:id/notes`, (schema, req) => {
      let id = req.params.id;
      let field = `${type}_id`;
      const agent = schema.db.users[0];
      const user = schema.db.users[1];
      const data = JSON.parse(req.requestBody);
      data.body_text = data.contents;
      data.body_html = data.contents;
      data.post_type = null;
      data.resource_url = `https://brewfictus.kayako.com/api/v1/${type}s/${id}/notes/${schema.db.notes.length}`;
      delete data.contents;
      delete data.user_id;
      delete data.note_id;
      delete data.post_id;
      delete data.uuid;
      delete data.created_at;
      delete data.updated_at;

      data[field] = id;

      const note = this.create('note', data);
      note.user = { id: agent.id, resource_type: 'user' };

      const action = this.create('action');

      let activityData = null;

      if (type === 'user') {
        const activityActor = this.create('activity-actor', agent);
        activityActor.full_title = agent.full_name;
        activityActor.title = agent.full_name;
        activityActor.original = agent;

        const activityObject = this.create('activity-object', user);
        activityObject.full_title = user.full_name;
        activityObject.title = user.full_name;
        activityObject.original = user;

        const activityResult = this.create('activity-result', user);
        activityResult.full_title = note.body_text;
        activityResult.title = note.body_text;
        activityResult.original = note;

        activityData = this.create('activity', {
          activity: `create_${type}_note`,
          actor: activityActor,
          verb: 'NOTE',
          note: note,
          summary: `<@https://brewfictus.kayako.com/Base/User/${agent.id}|${agent.full_name}> added a note on <@https://jay.kayako.com/Base/User/${user.id}|${user.full_name}>`,
          actions: [ action ],
          object: activityObject,
          result: activityResult
        });
      }

      let noteChannel = schema.db.channels.where({type: 'NOTE'})[0];
      const now = new Date();
      const post = this.create('post', {
        subject: note.body_text,
        contents: note.body_text,
        created_at: now,
        updated_at: now,
        creator: agent,
        original: activityData,
        source_channel: noteChannel,
        [field]: id
      });

      return new Mirage.Response(201, {}, {
        status: 201,
        data: note,
        resource: 'note',
        resources: {
          user: {
            [agent.id]: agent
          },
          channel: arrayToObjectWithNumberedKeys(schema.db.channels)
        }
      });
    });
  });

  ['case', 'user', 'organization'].forEach(type => {
    this.put(`/api/v1/${type}s/:${type}_id/notes/:note_id`, (schema, request) => {

      const id = request.params.note_id;
      const typeId = request.params[`${type}_id`];
      const requestData = JSON.parse(request.requestBody);
      requestData.resource_url = `https://brewfictus.kayako.com/api/v1/${type}s/${typeId}/notes/${id}`;

      let updatedNote = schema.db.notes.update(id, requestData);

      return {
        data: updatedNote,
        resource: 'note',
        status: 200
      };
    });
  });

  this.get('/api/v1/cases/:id/messages', (schema) => {
    return {
      data: [],
      limit: 10,
      offset: 0,
      resource: 'case_message',
      status: 200,
      total_count: 0
    };
  });

  this.get('/api/v1/messages/:id', function(schema, req) {
    const message = schema.db.messages.find(req.params.id);
    if (message) {
      return { status: 200, data: message, resource: 'case_message' };
    } else {
      return { status: 404 };
    }
  });

  this.get('/api/v1/cases/:id/activities', (schema, request) => {
    let since = request.queryParams.since;
    let until = request.queryParams.until;

    let activities = schema.db.activities;
    if (since) {
      activities = activities
        .filter(activity => moment(activity.created_at).isAfter(moment.unix(since)));
    } else if (until) {
      activities = activities
        .filter(activity => moment(activity.created_at).isBefore(moment.unix(until)));
    }

    return {
      data: activities,
      resource: 'activity',
      status: 200,
      total_count: schema.db.activities.length
    };
  });

  ['/api/v1/users/:id/activities', '/api/v1/organizations/:id/activities'].forEach(url => {
    this.get(url, (schema, request) => {
      let { since, until, limit, sort_order } = request.queryParams;

      let activities = schema.db.activities;

      if (sort_order === 'ASC') {
        activities = activities.sort((a, b) => a.created_at - b.created_at);
      } else {
        activities = activities.sort((a, b) => b.created_at - a.created_at);
      }

      if (since) {
        activities = activities
          .filter(activity => moment(activity.created_at).isAfter(moment.unix(since)));
      } else if (until) {
        activities = activities
          .filter(activity => moment(activity.created_at).isBefore(moment.unix(until)));
      }
      console.log('activities', activities);

      let data = activities.slice(0, limit);
      let resources = gatherSideloadedResources(schema.db, data);

      return {
        data,
        resources,
        resource: 'activity',
        status: 200,
        total_count: schema.db.activities.length
      };
    });
  });

  this.get('/api/v1/cases/:id/reply/channels', (schema) => {
    return {
      data: schema.db.channels,
      resource: 'channel',
      resources: {
        brand: arrayToObjectWithNumberedKeys(schema.db.brands),
        facebook_account: arrayToObjectWithNumberedKeys(schema.db.facebookAccounts),
        facebook_page: arrayToObjectWithNumberedKeys(schema.db.facebookPages),
        locale: schema.db.locales,
        mailbox: arrayToObjectWithNumberedKeys(schema.db.mailboxes),
        twitter_account: arrayToObjectWithNumberedKeys(schema.db.twitterAccounts)
      },
      status: 200,
      total_count: schema.db.channels.length
    };
  });

  this.post('/api/v1/cases/:id/reply', (schema, req) => {
    let attrs = JSON.parse(req.requestBody);
    attrs.contents = purify(attrs.contents);
    let targetCase = schema.db.cases.find(req.params.id);
    let original = createOriginalForPost(server, attrs);
    let post = server.create('post', {
      client_id: attrs.client_id,
      subject: null,
      contents: attrs.contents,
      creator: rel(targetCase.creator),
      identity: null,
      source_channel: rel(original.source_channel),
      attachments: (original.attachments || []).map(rel),
      source: attrs.channel,
      metadata: {},
      original: rel(original),
      post_status: 'NOT_SENT',
      post_status_updated_at: new Date(),
      case_id: req.params.id
    });
    let data = {
      posts: [rel(post)],
      'case': rel(targetCase),
      resource_type: 'case_reply'
    };
    let resources = gatherSideloadedResources(schema.db, data);

    return new Mirage.Response(201, {}, {
      status: 201,
      data,
      resource: 'case_reply',
      resources
    });
  });

  this.get('/api/v1/cases/priorities', (schema) => {
    return {
      data: schema.db.casePriorities,
      resource: 'case_priority',
      resources: {
        locale_field: arrayToObjectWithNumberedKeys(schema.db.localeFields)
      },
      status: 200,
      total_count: schema.db.casePriorities.length
    };
  });

  this.post('/api/v1/cases/priorities', (schema, req) => {
    const data = JSON.parse(req.requestBody);
    const newPriority = server.create('case-priority', data);
    return new Mirage.Response(201, {}, { status: 201, data: newPriority, resource: newPriority.resource_type });
  });

  this.put('/api/v1/cases/priorities/:id', (schema, request) => {
    return {};
  });

  this.delete('/api/v1/cases/priorities/:id', () => {
    return { status: 200 };
  });

  this.get('/api/v1/cases/types', (schema) => {
    return {
      data: schema.db.caseTypes,
      resource: 'case_type',
      status: 200,
      total_count: schema.db.caseTypes.length
    };
  });

  this.post('/api/v1/cases/statuses', (schema, req) => {
    const data = JSON.parse(req.requestBody);
    data.is_system = false;
    data.type = data.status_type;
    delete(data.status_type);
    delete(data.sort_order);
    const status = server.create('case-status', data);

    return new Mirage.Response(201, {}, { status: 201, data: status, resource: 'case_status' });
  });

  this.get('/api/v1/cases/statuses', (schema) => {
    return {
      data: schema.db.caseStatuses,
      resource: 'case_status',
      resources: {
        locale_field: arrayToObjectWithNumberedKeys(schema.db.localeFields)
      },
      status: 200,
      total_count: schema.db.caseStatuses.length
    };
  });

  this.get('/api/v1/cases/statuses/:id', (schema, request) => {
    return {
      data: schema.db.caseStatuses.find(request.params.id),
      resource: 'case_status',
      status: 200
    };
  });

  this.put('/api/v1/cases/statuses/:id', (schema, request) => {
    const id = request.params.id;
    const requestData = JSON.parse(request.requestBody);
    let updatedStatus = schema.db.caseStatuses.update(id, requestData);

    return {
      data: updatedStatus,
      resource: 'case_status',
      status: 200
    };
  });

  this.delete('/api/v1/cases/statuses/:id', (schema, request) => {
    const id = request.params.id;
    schema.db.caseStatuses.remove(id);
    return { status: 200 };
  });

  this.get('/api/v1/cases/types/:id', (schema, request) => {
    return {
      data: schema.db.caseTypes.find(request.params.id),
      resource: 'case_type',
      status: 200
    };
  });

  this.put('/api/v1/cases/types/:id', (schema, request) => {
    const id = request.params.id;
    const requestData = JSON.parse(request.requestBody);
    let updatedType = schema.db.caseTypes.update(id, requestData);

    return {
      data: updatedType,
      resource: 'case_type',
      status: 200
    };
  });

  this.delete('/api/v1/cases/types/:id', () => {
    return { status: 200 };
  });

  this.post('/api/v1/cases/types', (schema, req) => {
    let payload = JSON.parse(req.requestBody);

    const newType = server.create('case_type', payload);

    return new Mirage.Response(201, {}, {
      status: 201,
      data: newType,
      resource: newType.resource_type,
      resources: []
    });
  });

  this.get('/api/v1/cases/reply/channels', (schema) => {
    return schema.db.casesreplychannels[0];
  });

  this.get('/api/v1/cases/:id/channels', (schema) => {
    return {
      data: [],
      resource: 'channel',
      status: 200
    };
  });

  this.get('/api/v1/autocomplete/emails', (schema, request) => {
    return {
      status: 200,
      data: schema.db.identityAutocompleteEmails,
      resource: 'identity',
      resources: {
        identity_email: arrayToObjectWithNumberedKeys(schema.db.identityEmails),
        identity_domain: arrayToObjectWithNumberedKeys(schema.db.identityDomains),
        field_option: arrayToObjectWithNumberedKeys(schema.db.fieldOptions),
        role: arrayToObjectWithNumberedKeys(schema.db.roles),
        team: arrayToObjectWithNumberedKeys(schema.db.teams),
        user: arrayToObjectWithNumberedKeys(schema.db.users),
        user_field: arrayToObjectWithNumberedKeys(schema.db.userFields),
        organization: arrayToObjectWithNumberedKeys(schema.db.organizations)
      },
      total_count: 10
    };
  });

  this.get('/api/v1/autocomplete/tags', (schema, request) => {
    const tagName = request.queryParams.name;
    const tags = schema.db.tags.filter(tag => tag.name.indexOf(tagName) !== -1);
    return {
      status: 200,
      data: tags,
      resource: 'tag',
      total_count: tags.length
    };
  });

  this.get('/api/v1/cases/macros', (schema) => {
    return {
      status: 200,
      data: schema.db.macros,
      resource: 'macro',
      resources: {
        case_status: arrayToObjectWithNumberedKeys(schema.db.caseStatuses),
        case_priority: arrayToObjectWithNumberedKeys(schema.db.casePriorities),
        case_type: arrayToObjectWithNumberedKeys(schema.db.caseTypes),
        identity_email: arrayToObjectWithNumberedKeys(schema.db.identityEmails),
        role: arrayToObjectWithNumberedKeys(schema.db.roles),
        team: arrayToObjectWithNumberedKeys(schema.db.teams),
        user: arrayToObjectWithNumberedKeys(schema.db.users),
        user_field: arrayToObjectWithNumberedKeys(schema.db.userFields)
      },
      total_count: schema.db.macros.length
    };
  });

  this.post('/api/v1/cases/macros', function(schema, req) {
    const data = JSON.parse(req.requestBody);
    const macro = schema.db.macros.insert(data);
    macro.resource_type = 'macro';

    return new Mirage.Response(201, {}, {
      status: 201,
      data: macro,
      id: macro.id,
      resource: macro.resource_type,

      resources: {
        case_status: arrayToObjectWithNumberedKeys(schema.db.caseStatuses),
        case_priority: arrayToObjectWithNumberedKeys(schema.db.casePriorities),
        case_type: arrayToObjectWithNumberedKeys(schema.db.caseTypes),
        identity_email: arrayToObjectWithNumberedKeys(schema.db.identityEmails),
        role: arrayToObjectWithNumberedKeys(schema.db.roles),
        team: arrayToObjectWithNumberedKeys(schema.db.teams),
        user: arrayToObjectWithNumberedKeys(schema.db.users),
        user_field: arrayToObjectWithNumberedKeys(schema.db.userFields)
      }
    });
  });

  this.get('/api/v1/cases/macros/:id', (schema, req) => {
    const macro = schema.db.macros.find(req.params.id);
    macro.resource_type = 'macro';

    return new Mirage.Response(200, {}, {
      status: 200,
      id: macro.id,
      data: macro,
      resource: 'macro',

      resources: {
        case_status: arrayToObjectWithNumberedKeys(schema.db.caseStatuses),
        case_priority: arrayToObjectWithNumberedKeys(schema.db.casePriorities),
        case_type: arrayToObjectWithNumberedKeys(schema.db.caseTypes),
        identity_email: arrayToObjectWithNumberedKeys(schema.db.identityEmails),
        role: arrayToObjectWithNumberedKeys(schema.db.roles),
        team: arrayToObjectWithNumberedKeys(schema.db.teams),
        user: arrayToObjectWithNumberedKeys(schema.db.users),
        user_field: arrayToObjectWithNumberedKeys(schema.db.userFields)
      }
    });
  });

  this.get('/api/v1/cases/ratings/recent', (schema) => {
    return {
      status: 200,
      data: [],
      resource: 'rating',
      total_count: 0
    };
  });

  this.get('/api/v1/autocomplete/users', (schema, request) => {
    let queryString = request.queryParams.name.toLowerCase();
    const users = schema.db.users.where(u => u.full_name.toLowerCase().indexOf(queryString) > -1);

    return {
      status: 200,
      data: users,
      resource: 'user',
      resources: {
        business_hour: arrayToObjectWithNumberedKeys(schema.db.businessHours),
        field_option: arrayToObjectWithNumberedKeys(schema.db.fieldOptions),
        identity_email: arrayToObjectWithNumberedKeys(users.reduce((ary, u) => ary.concat(u.emails), [])),
        identity_twitter: arrayToObjectWithNumberedKeys(users.reduce((ary, u) => ary.concat(u.twitter), [])),
        identity_phone: arrayToObjectWithNumberedKeys(users.reduce((ary, u) => ary.concat(u.phones), [])),
        identity_facebook: arrayToObjectWithNumberedKeys(users.reduce((ary, u) => ary.concat(u.facebook), [])),
        role: arrayToObjectWithNumberedKeys(users.reduce((ary, u) => ary.concat([u.role]), [])),
        team: arrayToObjectWithNumberedKeys(users.reduce((ary, u) => ary.concat(u.teams), [])),
        user_field: arrayToObjectWithNumberedKeys(schema.db.userFields)
      },
      total_count: users.length
    };
  });

  this.get('/api/v1/autocomplete/organizations', (schema, request) => {
    let queryString = request.queryParams.name.toLowerCase();
    const organizations = schema.db.organizations.where(org => org.name.toLowerCase().indexOf(queryString) > -1);

    return {
      status: 200,
      data: organizations,
      resource: 'organization',
      resources: {},
      total_count: organizations.length
    };
  });

  this.get('/api/v1/search', (schema, request) => {
    const query = request.queryParams.query;
    const freeTerm = query.replace(/[\w\-]+:[\w\-]+/g, '').trim().toLowerCase();
    const offset = parseInt(request.queryParams.offset, 10) || 0;
    const limit = parseInt(request.queryParams.limit, 10) || 30;
    const users = schema.db.users.filter(u => u.full_name.toLowerCase().indexOf(freeTerm) > -1);
    const cases = schema.db.cases.filter(c => c.subject.toLowerCase().indexOf(freeTerm) > -1);
    const orgs = schema.db.organizations.filter(o => o.name.toLowerCase().indexOf(freeTerm) > -1);

    let combined;
    switch (request.queryParams.resources) {
      case 'CASES':
        combined = cases; break;
      case 'USERS':
        combined = users; break;
      case 'ORGANIZATIONS':
        combined = orgs; break;
      default:
        combined = cases.concat(users).concat(orgs); break;
    }

    const results = combined.map(res => {
      const title = res.subject || res.full_name || res.name;
      return {
        id: res.id,
        title: title,
        data: rel(res),
        relevance: Math.random(),
        resource: res.resource_type,
        resource_url: res.resource_url,
        snippet: title.replace(new RegExp(freeTerm, 'gi'), `<em>${freeTerm}</em>`)
      };
    }).sortBy('relevance');

    let data = results.slice(offset, limit + offset);
    let resources = gatherSideloadedResources(schema, results);

    return {
      status: 200,
      resource: 'result',
      data,
      resources,
      total_count: results.length
    };
  });

  this.get('/api/v1/cases/:case_id/tags', (schema, req) => {
    let theCase = schema.db.cases.find(req.params.case_id);
    return {
      status: 200,
      data: theCase.tags,
      resource: 'tag',
      resources: []
    };
  });

  this.get('/api/v1/users/:user_id/tags', (schema, req) => {
    let user = schema.db.users.find(req.params.user_id);
    return {
      status: 200,
      data: user.tags,
      resource: 'tag',
      resources: []
    };
  });

  this.get('/api/v1/organizations/:organization_id/tags', (schema, req) => {
    let organization = schema.db.organizations.find(req.params.organization_id);
    return {
      status: 200,
      data: organization.tags,
      resource: 'tag',
      resources: []
    };
  });

//User Fields
  this.post('/api/v1/users/fields', handlePostUserFields);

  this.get('/api/v1/users/fields', (schema) => {
    return {
      status: 200,
      data: schema.db.userFields,
      resource: 'user_field',
      resources: {
        field_option: arrayToObjectWithNumberedKeys(schema.db.fieldOptions),
        locale_field: arrayToObjectWithNumberedKeys(schema.db.localeFields)
      }
    };
  });

  this.get('/api/v1/tags/:id', (schema, req) => {
    let tag = schema.db.tags.find(req.params.id);
    return {
      status: 200,
      data: {
        name: tag.name,
        resource_type: 'tag'
      },
      resource: 'tag'
    };
  });

  this.put('/api/v1/users/fields/:id', (schema, request) => {
    const id = request.params.id;
    const requestData = JSON.parse(request.requestBody);

    const newCustomerTitles = [];
    const customerTitles = requestData.customer_titles;
    Reflect.deleteProperty(requestData, 'customer_titles');
    if (customerTitles) {
      customerTitles.forEach((customerTitle) => {
        let newField;
        if (customerTitle.id) {
          let attrs = Object.assign({}, customerTitle);
          delete attrs.id;
          newField = schema.db.localeFields.update(customerTitle.id, attrs);
        } else {
          newField = schema.db.localeFields.insert(customerTitle);
        }
        newCustomerTitles.push({ id: newField.id, resource_type: 'locale_field' });
      });
    }

    const newDescriptions = [];
    const descriptions = requestData.descriptions;
    Reflect.deleteProperty(requestData, 'descriptions');
    if (descriptions) {
      descriptions.forEach((description) => {
        let newField;
        if (description.id) {
          let attrs = Object.assign({}, description);
          delete attrs.id;
          newField = schema.db.localeFields.update(description.id, attrs);
        } else {
          newField = schema.db.localeFields.insert(description);
        }
        newDescriptions.push({ id: newField.id, resource_type: 'locale_field' });
      });
    }

    const newOptions = [];
    const options = requestData.options;
    Reflect.deleteProperty(requestData, 'options');
    if (options) {
      options.forEach((option) => {
        const newValues = [];
        option.values.forEach((value) => {
          let attrs = Object.assign({}, value);
          delete attrs.id;
          const newField = schema.db.localeFields.insert(attrs);
          newValues.push({ id: newField.id, resource_type: 'locale_field' });
        });
        option.values = newValues;
        let attrs = Object.assign({}, option);
        delete attrs.id;
        const newField = schema.db.fieldOptions.insert(attrs);
        newOptions.push({ id: newField.id, resource_type: 'field_option' });
      });
    }

    requestData.resource_type = 'user_field';
    let responseData = schema.db.userFields.update(id, requestData);

    responseData.customer_titles = newCustomerTitles;
    responseData.descriptions = newDescriptions;
    responseData.options = newOptions;

    let payload = {
      status: 200,
      data: responseData,
      resource: 'user_field',
      resources: {
        field_option: arrayToObjectWithNumberedKeys(schema.db.fieldOptions),
        locale_field: arrayToObjectWithNumberedKeys(schema.db.localeFields)
      }
    };
    return payload;
  });

  this.get('/api/v1/users/fields/:id', (schema, request) => {
    return {
      status: 200,
      data: schema.db.userFields.find(request.params.id),
      resource: 'user_field',
      resources: {
        field_option: arrayToObjectWithNumberedKeys(schema.db.fieldOptions),
        locale_field: arrayToObjectWithNumberedKeys(schema.db.localeFields)
      }
    };
  });

  this.delete('/api/v1/users/fields/:id', (schema, request) => {
    const id = request.params.id;

    schema.db.userFields.remove(id);

    return {
      status: 200
    };
  });

  this.post('/api/v1/users/fields/options', (schema) => {
    return new Mirage.Response(201, {}, '');
  });

  this.post('/api/v1/users/fields/:id/options', (schema, request) => {
    const requestData = JSON.parse(request.requestBody);
    let responseData = schema.db.fieldOptions.insert(requestData);

    responseData.resource_type = 'field_option';
    let payload = {
      status: 201,
      data: responseData,
      resource: 'field_option',
      resources: []
    };
    return new Mirage.Response(201, {}, payload);
  });

  this.put('/api/v1/users/fields/:id/options/:id', (schema, request) => {
    const id = request.params.id;
    const requestData = JSON.parse(request.requestBody);
    let responseData = schema.db.fieldOptions.update(id, requestData);

    responseData.resource_type = 'field_option';
    let payload = {
      status: 200,
      data: responseData,
      resource: 'field_option',
      resources: []
    };
    return payload;
  });
//User Fields End

//Case Fields
  this.post('/api/v1/cases/fields', handlePostCaseFields);

  this.get('/api/v1/cases/fields', (schema) => {
    return {
      status: 200,
      data: schema.db.caseFields,
      resource: 'case_field',
      resources: {
        field_option: arrayToObjectWithNumberedKeys(schema.db.fieldOptions),
        locale_field: arrayToObjectWithNumberedKeys(schema.db.localeFields)
      }
    };
  });

  this.put('/api/v1/cases/fields/:id', (schema, request) => {
    const id = request.params.id;
    const requestData = JSON.parse(request.requestBody);
    const newCustomerTitles = [];
    const customerTitles = requestData.customer_titles;
    Reflect.deleteProperty(requestData, 'customer_titles');
    if (customerTitles) {
      customerTitles.forEach((customerTitle) => {
        let newField;
        if (customerTitle.id) {
          let attrs = Object.assign({}, customerTitle);
          delete attrs.id;
          newField = schema.db.localeFields.update(customerTitle.id, attrs);
        } else {
          newField = schema.db.localeFields.insert(customerTitle);
        }
        newCustomerTitles.push({ id: newField.id, resource_type: 'locale_field' });
      });
    }

    const newDescriptions = [];
    const descriptions = requestData.descriptions;
    Reflect.deleteProperty(requestData, 'descriptions');
    if (descriptions) {
      descriptions.forEach((description) => {
        let newField;
        if (description.id) {
          let attrs = Object.assign({}, description);
          delete attrs.id;
          newField = schema.db.localeFields.update(description.id, attrs);
        } else {
          newField = schema.db.localeFields.insert(description);
        }
        newDescriptions.push({ id: newField.id, resource_type: 'locale_field' });
      });
    }

    const newOptions = [];
    const options = requestData.options;
    Reflect.deleteProperty(requestData, 'options');
    if (options) {
      options.forEach((option) => {
        const newValues = [];
        option.values.forEach((value) => {
          let attrs = Object.assign({}, value);
          delete attrs.id;
          const newField = schema.db.localeFields.insert(attrs);
          newValues.push({ id: newField.id, resource_type: 'locale_field' });
        });
        option.values = newValues;
        let attrs = Object.assign({}, option);
        delete attrs.id;
        const newField = schema.db.fieldOptions.insert(attrs);
        newOptions.push({ id: newField.id, resource_type: 'field_option' });
      });
    }

    requestData.resource_type = 'case_field';
    let responseData = schema.db.caseFields.update(id, requestData);

    Reflect.deleteProperty(responseData, 'priorities');

    responseData.options.forEach((option) => {
      //old locale-fields for the values on this option will be orphaned but
      //not referenced here
      schema.db.fieldOptions.remove(option.id);
    });

    responseData.customer_titles = newCustomerTitles;
    responseData.descriptions = newDescriptions;
    responseData.options = newOptions;

    let payload = {
      status: 200,
      data: responseData,
      resource: 'case_field',
      resources: {
        field_option: arrayToObjectWithNumberedKeys(schema.db.fieldOptions),
        locale_field: arrayToObjectWithNumberedKeys(schema.db.localeFields)
      }
    };
    return payload;
  });

  this.get('/api/v1/cases/fields/:id', (schema, request) => {
    return {
      status: 200,
      data: schema.db.caseFields.find(request.params.id),
      resource: 'case_field',
      resources: {
        field_option: arrayToObjectWithNumberedKeys(schema.db.fieldOptions),
        locale_field: arrayToObjectWithNumberedKeys(schema.db.localeFields)
      }
    };
  });

  this.delete('/api/v1/cases/fields/:id', (schema, request) => {
    const id = request.params.id;

    schema.db.caseFields.remove(id);

    return {
      status: 200
    };
  });

  this.post('/api/v1/cases/fields/options', (schema) => {
    return new Mirage.Response(201, {}, '');
  });

  this.post('/api/v1/cases/fields/:id/options', (schema, request) => {
    const requestData = JSON.parse(request.requestBody);
    let responseData = schema.db.fieldOptions.insert(requestData);

    responseData.resource_type = 'field_option';
    let payload = {
      status: 201,
      data: responseData,
      resource: 'field_option',
      resources: []
    };
    return new Mirage.Response(201, {}, payload);
  });

  this.put('/api/v1/cases/fields/:id/options/:id', (schema, request) => {
    const id = request.params.id;
    const requestData = JSON.parse(request.requestBody);
    let responseData = schema.db.fieldOptions.update(id, requestData);

    responseData.resource_type = 'field_option';
    let payload = {
      status: 200,
      data: responseData,
      resource: 'field_option',
      resources: []
    };
    return payload;
  });

  this.put('api/v1/cases/fields/reorder', () => {
    return { status: 200 };
  });
//Case Fields End

//Organization Fields
  this.post('/api/v1/organizations/fields', handlePostOrganizationFields);

  this.get('/api/v1/organizations/fields', (schema) => {
    return {
      status: 200,
      data: schema.db.organizationFields,
      resource: 'organization_field',
      resources: {
        field_option: arrayToObjectWithNumberedKeys(schema.db.fieldOptions),
        locale_field: arrayToObjectWithNumberedKeys(schema.db.localeFields)
      }
    };
  });

  this.put('/api/v1/organizations/fields/:id', (schema, request) => {
    const id = request.params.id;
    const requestData = JSON.parse(request.requestBody);

    const newCustomerTitles = [];
    const customerTitles = requestData.customer_titles;
    Reflect.deleteProperty(requestData, 'customer_titles');

    if (customerTitles) {
      customerTitles.forEach((customerTitle) => {
        let newField;
        if (customerTitle.id) {
          let attrs = Object.assign({}, customerTitle);
          delete attrs.id;
          newField = schema.db.localeFields.update(customerTitle.id, attrs);
        } else {
          newField = schema.db.localeFields.insert(customerTitle);
        }
        newCustomerTitles.push({ id: newField.id, resource_type: 'locale_field' });
      });
    }

    const newDescriptions = [];
    const descriptions = requestData.descriptions;
    Reflect.deleteProperty(requestData, 'descriptions');
    if (descriptions) {
      descriptions.forEach((description) => {
        let newField;
        if (description.id) {
          let attrs = Object.assign({}, description);
          delete attrs.id;
          newField = schema.db.localeFields.update(description.id, attrs);
        } else {
          newField = schema.db.localeFields.insert(description);
        }
        newDescriptions.push({ id: newField.id, resource_type: 'locale_field' });
      });
    }

    const newOptions = [];
    const options = requestData.options;
    Reflect.deleteProperty(requestData, 'options');
    if (options) {
      options.forEach((option) => {
        const newValues = [];
        option.values.forEach((value) => {
          let attrs = Object.assign({}, value);
          delete attrs.id;
          const newField = schema.db.localeFields.insert(attrs);
          newValues.push({ id: newField.id, resource_type: 'locale_field' });
        });
        option.values = newValues;
        let attrs = Object.assign({}, option);
        delete attrs.id;
        const newField = schema.db.fieldOptions.insert(attrs);
        newOptions.push({ id: newField.id, resource_type: 'field_option' });
      });
    }

    requestData.resource_type = 'organization_field';
    let responseData = schema.db.organizationFields.update(id, requestData);

    responseData.customer_titles = newCustomerTitles;
    responseData.descriptions = newDescriptions;
    responseData.options = newOptions;

    let payload = {
      status: 200,
      data: responseData,
      resource: 'organization_field',
      resources: {
        field_option: arrayToObjectWithNumberedKeys(schema.db.fieldOptions),
        locale_field: arrayToObjectWithNumberedKeys(schema.db.localeFields)
      }
    };
    return payload;
  });

  this.get('/api/v1/organizations/fields/:id', (schema, request) => {
    return {
      status: 200,
      data: schema.db.organizationFields.find(request.params.id),
      resource: 'organization_field',
      resources: {
        field_option: arrayToObjectWithNumberedKeys(schema.db.fieldOptions),
        locale_field: arrayToObjectWithNumberedKeys(schema.db.localeFields)
      }
    };
  });

  this.delete('/api/v1/organizations/fields/:id', (schema, request) => {
    const id = request.params.id;

    schema.db.organizationFields.remove(id);

    return {
      status: 200
    };
  });

  this.post('/api/v1/organizations/fields/options', (schema) => {
    return new Mirage.Response(201, {}, '');
  });

  this.post('/api/v1/organizations/fields/:id/options', (schema, request) => {
    const requestData = JSON.parse(request.requestBody);
    let responseData = schema.db.fieldOptions.insert(requestData);

    responseData.resource_type = 'field_option';
    let payload = {
      status: 201,
      data: responseData,
      resource: 'field_option',
      resources: []
    };
    return new Mirage.Response(201, {}, payload);
  });

  this.put('/api/v1/organizations/fields/:id/options/:id', (schema, request) => {
    const id = request.params.id;
    const requestData = JSON.parse(request.requestBody);
    let responseData = schema.db.fieldOptions.update(id, requestData);

    responseData.resource_type = 'field_option';
    let payload = {
      status: 200,
      data: responseData,
      resource: 'field_option',
      resources: []
    };
    return payload;
  });
//Organization Fields End

  this.get('/api/v1/locales', function(schema /*, req*/) {
    let locales = schema.db.locales;
    return {
      status: 200,
      data: locales,
      resource: 'locale',
      total_count: locales.length
    };
  });

  this.get('/api/v1/locales/:id', function(schema, request) {
    const locale = schema.db.locales.find(request.params.id);
    return {
      status: 200,
      data: locale,
      resource: 'locale'
    };
  });

  this.put('/api/v1/locales/:id', function({ db }, req) {
    const id = req.params.id;
    const attrs = JSON.parse(req.requestBody);
    const record = db.locales.update(id, attrs);

    return {
      status: 200,
      data: record,
      resource: 'locale'
    };
  });

  this.put('/api/v1/locale/fields/:id', (schema, request) => {
    const id = request.params.id;
    const requestData = JSON.parse(request.requestBody);
    let responseData = schema.db.localeFields.update(id, requestData);

    responseData.resource_type = 'locale_field';
    let payload = {
      status: 200,
      data: responseData,
      resource: 'locale_field',
      resources: []
    };
    return new Mirage.Response(200, {}, payload);
  });

  this.post('/api/v1/locale/fields', (schema, request) => {
    const requestData = JSON.parse(request.requestBody);
    let responseData = schema.db.localeFields.insert(requestData);

    responseData.resource_type = 'locale_field';
    let payload = {
      status: 201,
      data: responseData,
      resource: 'locale_field',
      resources: []
    };
    return new Mirage.Response(201, {}, payload);
  });

  this.get('/api/v1/mails', (schema, req) => {
    let { limit, offset } = req.queryParams;
    limit = parseInt(limit || 1000000, 10);
    offset = parseInt(offset || 0, 10);
    let mails;

    if (req.queryParams.is_suspended) {
      mails = schema.db.mails.where({ is_suspended: true });
    } else {
      mails = schema.db.mails.where({ is_suspended: false });
    }

    if (req.queryParams.order_by_column) {
      mails = mails.sortBy(req.queryParams.order_by_column);
      if (req.queryParams.order_by === 'desc') {
        mails.reverse();
      }
    }

    let totalCount = mails.length;
    mails = mails.slice(offset, offset + limit);

    return {
      status: 200,
      data: mails,
      resource: 'mail',
      offset,
      limit,
      total_count: totalCount
    };
  });

  this.put('/api/v1/mails/:id', (schema, req) => {
    const newState = schema.db.mails.update(req.params.id, JSON.parse(req.requestBody));
    return {
      status: 200,
      data: newState
    };
  });

  this.delete('/api/v1/mails', (schema, req) => {
    schema.db.mails.remove(req.queryParams.ids);
    return { status: 200 };
  });

  this.delete('/api/v1/mails/:id', (schema, req) => {
    schema.db.mails.remove(req.params.id);
    return { status: 200 };
  });

  this.put('/api/v1/cases/statuses/reorder', (schema, req) => {
    return { status: 200 };
  });

  this.put('/api/v1/cases/priorities/reorder', (schema, req) => {
    return { status: 200 };
  });


  this.post('/api/v1/core/file', (schema) => {
    return {
      status: 201,
      data: {
        id: 357070,
        name: 'test-file-name.txt',
        size: 2,
        content_type: 'text/x-php',
        content_url: 'https://support.kayakodev.net/api/v1/files/357070/content',
        created_at: '2016-01-27T13:10:43Z',
        expiry_at: '2016-01-28T01:10:43Z',
        resource_type: 'file',
        resource_url: 'https://support.kayakodev.net/api/v1/files/357070'
      },
      resource: 'file'
    };
  });

  this.get('/api/v1/businesshours', (schema) => {
    return {
      status: 200,
      data: schema.db.businesshours,
      resource: 'business_hour',
      resources: {
        businesshour_holiday: {}
      }
    };
  });

  this.get('/api/v1/businesshours/:id', (schema, req) => {
    const id = req.params.id;
    return {
      status: 200,
      data: schema.db.businesshours.find(id),
      resource: 'business_hour',
      resources: {}
    };
  });

  this.put('/api/v1/slas/:id', (schema, req) => {
    let attrs = JSON.parse(req.requestBody);
    let sla = schema.db.slas.update(req.params.id, attrs);

    return {
      status: 200,
      data: sla,
      resource: 'sla'
    };
  });

  this.get('/api/v1/slas', (schema) => {
    return {
      data: schema.db.slas,
      status: 200,
      resource: 'sla',
      total_count: schema.db.slas.length
    };
  });

  this.get('/api/v1/slas/definitions', (schema, request) => {
    return {
      status: 200,
      data: schema.db.definitions,
      resource: 'definition',
      total_count: schema.db.definitions.length
    };
  });

  this.get('/api/v1/slas/:id', (schema, request) => {
    if (isNaN(request.params.id)) {
      throw Error('Caught by a wild card!');
    }
    const id = parseInt(request.params.id);
    return {
      status: 200,
      data: schema.db.slas.find(id),
      resource: 'sla',
      resources: {
      }
    };
  });

  this.get('/api/v1/facebook/pages', (schema) => {
    return {
      status: 200,
      data: schema.db.facebookPages,
      resource: 'facebook_page'
    };
  });

  this.get('/api/v1/facebook/pages/:id', (schema, req) => {
    return {
      status: 200,
      data: schema.db.facebookPages.find(req.params.id),
      resource: 'facebook_page'
    };
  });

  this.put('/api/v1/facebook/pages/:id', (schema, req) => {
    let attrs = JSON.parse(req.requestBody);
    let page = schema.db.facebookPages.update(req.params.id, attrs);

    return {
      status: 200,
      data: page,
      resource: 'facebook_page'
    };
  });

  this.post('/api/v1/facebook/pages', (schema, req) => {
    const data = JSON.parse(req.requestBody);
    data.resource_type = 'facebook_page';
    const facebookPage = schema.db.facebookPages.insert(data);

    return new Mirage.Response(201, {}, {
      status: 201,
      data: facebookPage,
      resource: facebookPage.resource_type
    });
  });

  this.delete('/api/v1/facebook/pages/:id', (schema, req) => {
    schema.db.facebookPages.remove(req.params.id);

    return {
      status: 200
    };
  });

  // Triggers
  this.get('/api/v1/triggers', function(schema, req) {
    let triggers = schema.db.triggers;
    let predicateCollections = schema.db.triggers.reduce((accum, trigger) => {
      let collections = schema.db.predicateCollections.find(trigger.predicate_collections.mapBy('id'));
      return accum.concat(collections).uniq();
    }, []);
    let propositions = predicateCollections.reduce((accum, predColl) => {
      let propositions = schema.db.propositions.find(predColl.propositions.mapBy('id'));
      return accum.concat(propositions).uniq();
    }, []);
    let actions = schema.db.automationActions.find(
      triggers.reduce((accum, m) => accum.concat(m.actions.map(a => a.id)), [])
    );
    return {
      status: 200,
      data: triggers,
      resource: 'trigger',
      resources: {
        predicate_collection: arrayToObjectWithNumberedKeys(predicateCollections),
        proposition: arrayToObjectWithNumberedKeys(propositions),
        automation_action: arrayToObjectWithNumberedKeys(actions)
      }
    };
  });

  this.get('/api/v1/triggers/:id', function(schema, req) {
    let trigger = schema.db.triggers.find(req.params.id);
    let collections = schema.db.predicateCollections.find(trigger.predicate_collections.mapBy('id'));
    let propositions = collections.reduce((accum, c) => {
      let propositions = schema.db.propositions.find(c.propositions.mapBy('id'));
      return accum.concat(propositions).uniq();
    }, []);
    let actions = schema.db.automationActions.find(trigger.actions.map(e => e.id));
    return {
      status: 200,
      data: trigger,
      resource: 'trigger',
      resources: {
        predicate_collection: arrayToObjectWithNumberedKeys(collections),
        proposition: arrayToObjectWithNumberedKeys(propositions),
        automation_action: arrayToObjectWithNumberedKeys(actions)
      }
    };
  });

  this.post('/api/v1/triggers', function(schema, req) {
    let data = JSON.parse(req.requestBody);
    let propositions = [];
    let predicateCollections = data.predicate_collections.reduce((accum, collection) => {
      let collectionPropositions = collection.propositions.reduce((accum, proposition) => {
        return accum.concat([schema.db.propositions.insert(proposition)]);
      }, []);
      propositions.push(...collectionPropositions);
      collection.propositions = collectionPropositions.map(p => ({ id: p.id, resource_type: 'proposition' }));
      return accum.concat([schema.db.predicateCollections.insert(collection)]);
    }, []);
    let actions = data.actions.reduce((accum, data) => {
      data.attributes = Object.keys(data.attributes || {}).map(attr => ({ name: attr, value: data.attributes[attr] }));
      return accum.concat(schema.db.automationActions.insert(data));
    }, []);
    let newTriggerAttrs = Object.assign(data, {
      predicate_collections: predicateCollections.map(c => ({ id: c.id, resource_type: 'predicate_collection' })),
      actions: actions.map(c => ({ id: c.id, resource_type: 'automation_action' }))
    });
    let trigger = schema.db.triggers.insert(newTriggerAttrs);
    return new Mirage.Response(201, {}, {
      status: 201,
      data: trigger,
      resource: 'trigger',
      resources: {
        predicate_collection: arrayToObjectWithNumberedKeys(predicateCollections),
        proposition: arrayToObjectWithNumberedKeys(propositions),
        automation_action: arrayToObjectWithNumberedKeys(actions)
      }
    });
  });

  this.put('/api/v1/triggers/:id', function(schema, req) {
    let data = JSON.parse(req.requestBody);
    let propositions = [];
    let trigger = schema.db.triggers.find(req.params.id);
    let savedPredicateCollections = trigger.predicate_collections;
    // Remove deleted predicate collections
    savedPredicateCollections.forEach(collection => {
      if (data.predicate_collections.mapBy('id').indexOf(collection.id) === -1) {
        schema.db.predicateCollections.remove(collection.id);
      }
    });

    // Create or update predicate collections
    let predicateCollections = data.predicate_collections.reduce((accum, collection) => {
      if (collection.id) {
        // ~~Update~~
        // This logic at the moment won't ever be executed because the smart diffing argorithm
        // created by Kirill deletes the existing records and replaces all predicate collections
        // with new ones with the same data. I won't delete it in case we make it smarter, but
        // it's not guaranteed to work.
        let savedCollection = schema.db.predicateCollections.find(collection.id);
        savedCollection.propositions.forEach(proposition => {
          if (collection.propositions.mapBy('id').indexOf(proposition.id) === -1) {
            // This proposition has been deleted
            schema.db.propositions.remove(proposition.id);
          }
        });
        let collectionPropositions = collection.propositions.reduce((accum, proposition) => {
          if (proposition.id) {
            let newAttrs = Object.assign({}, proposition);
            delete newAttrs.id;
            return accum.concat([schema.db.propositions.update(proposition.id, newAttrs)]);
          } else {
            return accum.concat([schema.db.propositions.insert(proposition)]);
          }
        }, []);
        propositions.push(...collectionPropositions);
        let predicateCollection = schema.db.predicateCollections.update(collection.id, {
          propositions: propositions.map(p => ({ id: p.id, resource_type: 'proposition' }))
        });
        return accum.concat([predicateCollection]);
      } else {
        // ~~Create~~
        let collectionPropositions = collection.propositions.reduce((accum, proposition) => {
          proposition.resource_type = 'proposition';
          return accum.concat([schema.db.propositions.insert(proposition)]);
        }, []);
        propositions.push(...collectionPropositions);
        let predicateCollection = schema.db.predicateCollections.insert({
          resource_type: 'predicate_collection',
          propositions: collectionPropositions.map(p => ({ id: p.id, resource_type: 'proposition' }))
        });
        return accum.concat([predicateCollection]);
      }
    }, []);

    // Create or update actions
    let actions = data.actions.reduce((accum, data) => {
      let actionId = data.id;
      delete data.id;
      if (actionId) {
        // ~~Update~~
        return accum.concat([schema.db.automationActions.insert(actionId, data)]);
      } else {
        // ~~Create~~
        return accum.concat([schema.db.automationActions.insert(data)]);
      }

    }, []);
    // Update the trigger
    let newTriggerAttrs = Object.assign(data, {
      predicate_collections: predicateCollections.map(c => ({ id: c.id, resource_type: 'predicate_collection' })),
      actions: actions.map(c => ({ id: c.id, resource_type: 'automation_action' }))
    });
    delete newTriggerAttrs.id;
    trigger = schema.db.triggers.update(req.params.id, newTriggerAttrs);
    return {
      status: 200,
      data: trigger,
      resource: 'trigger',
      resources: {
        predicate_collection: arrayToObjectWithNumberedKeys(predicateCollections),
        proposition: arrayToObjectWithNumberedKeys(propositions),
        automation_action: arrayToObjectWithNumberedKeys(actions)
      }
    };
  });

  this.delete('/api/v1/triggers/:id', function(schema, req) {
    schema.db.triggers.remove(req.params.id);
    return { status: 200 };
  });

  this.put('/api/v1/triggers/reorder', function(schema, req) {
    let data = JSON.parse(req.requestBody);
    let triggers = schema.db.triggers.find(data.trigger_ids);
    triggers.forEach((trigger, idx) => schema.db.triggers.update(trigger.id, { execution_order: idx + 1 }));
    return {
      status: 200,
      data: schema.db.triggers.find(data.trigger_ids),
      resource: 'trigger',
      resources: {}
    };
  });

  this.get('/api/v1/triggers/definitions', (schema, request) => {
    return {
      status: 200,
      data: schema.db.definitions,
      resource: 'definition',
      total_count: schema.db.definitions.length
    };
  });

  // Automation Action Definitions
  this.get('/api/v1/triggers/actions/definitions', (schema, request) => {
    return {
      status: 200,
      data: schema.db.automationActionDefinitions,
      resource: 'automation_action_definition',
      total_count: schema.db.automationActionDefinitions.length
    };
  });

  this.get('/api/v1/triggers/channels', (schema, request) => {
    return {
      status: 200,
      data: schema.db.triggerChannels,
      resource: 'trigger_channel'
    };
  });

  this.get('/api/v1/brands', ({ db }, request) => {
    return {
      status: 200,
      data: db.brands,
      resource: 'brand',
      resources: {},
      meta: {
        total_count: db.brands.length
      }
    };
  });

  this.get('/api/v1/brands/:id', (schema, request) => {
    const brand = schema.db.brands.find(request.params.id);

    return {
      status: 200,
      data: brand,
      resource: 'brand'
    };
  });

  this.get('/api/v1/brands/:id/templates/:name', (schema, request) => {
    const brand = schema.db.brands.find(request.params.id);
    const template = schema.db.templates.where({ brand, name: request.params.name })[0];

    return {
      status: 200,
      data: template,
      resource: 'template'
    };
  });

  this.put('/api/v1/brands/:id/templates/:name', ({ db }, request) => {
    const brand = db.brands.find(request.params.id);
    const template = db.templates.where({ brand, name: request.params.name })[0];

    const attrs = JSON.parse(request.requestBody);
    const record = db.templates.update(template.id, attrs);

    return {
      status: 200,
      data: record,
      resource: 'template'
    };
  });

  this.post('/api/v1/brands/available', ({ db }, req) => {
    const sub_domain = JSON.parse(req.requestBody).sub_domain;
    const subDomainExists = db.brands.where({ sub_domain }).length > 0;
    if (subDomainExists) {
      return new Mirage.Response(400, {}, {
        status: 400
      });
    } else {
      return new Mirage.Response(200, {}, {
        status: 200
      });
    }
  });

  this.post('/api/v1/brands', function({ db }, req) {
    const data = JSON.parse(req.requestBody);
    data.resource_type = 'brand';
    const brand = db.brands.insert(data);
    return new Mirage.Response(201, {}, {
      status: 201,
      data: brand,
      resource: brand.resource_type
    });
  });

  this.put('/api/v1/brands/:id', function({ db }, req) {
    const id = req.params.id;
    const attrs = JSON.parse(req.requestBody);
    if (attrs.is_default) {
      db.brands.forEach(brand => {
        db.brands.update(brand.id, { is_default: false });
      });
    }

    if (attrs.ssl_certificate && attrs.private_key) {
      let certificate = db.sslCertificates.firstOrCreate({ brand_id: id });

      db.sslCertificates.update(certificate, { certificate: attrs.ssl_certificate });

      Reflect.deleteProperty(attrs, 'ssl_certificate');
      Reflect.deleteProperty(attrs, 'private_key');

      attrs.is_ssl_enabled = true;
    }

    const record = db.brands.update(id, attrs);

    return {
      status: 200,
      data: record,
      resource: 'brand'
    };
  });

  this.delete('/api/v1/brands/:id', function({ db }, req) {
    db.brands.remove(req.params.id);
    return { status: 200 };
  });

  this.get('/api/v1/brands/:id/certificate', function({ db }, req) {
    let record = db.sslCertificates.firstOrCreate({ brand_id: req.params.id });
    let data = { certificate: record.certificate };

    return {
      status: 200,
      data,
      resource: 'ssl_certificate'
    };
  });

  this.get('/api/v1/mailboxes', ({ db }, request) => {
    return {
      status: 200,
      data: db.mailboxes,
      resource: 'mailbox',
      resources: {
        brand: arrayToObjectWithNumberedKeys(db.brands)
      }
    };
  });

  this.post('/api/v1/mailboxes', function({ db }, req) {
    const data = JSON.parse(req.requestBody);
    data.resource_type = 'mailbox';
    const mailbox = db.mailboxes.insert(data);
    return new Mirage.Response(201, {}, {
      status: 201,
      data: mailbox,
      resource: mailbox.resource_type
    });
  });

  this.put('/api/v1/mailboxes/:id', function({ db }, req) {
    const id = req.params.id;
    const attrs = JSON.parse(req.requestBody);
    const record = db['mailboxes'].update(id, attrs);

    return {
      status: 200,
      data: record,
      resource: 'mailbox'
    };
  });

  this.delete('/api/v1/mailboxes/:id', function({ db }, req) {
    db['mailboxes'].remove(req.params.id);
    return { status: 200 };
  });

  this.get('/api/v1/mailboxes/:id/configuration', function() {
    return JSON.parse(`{
        "status": 200,
        "data": {
            "is_valid": true,
            "dns_records": [
                {
                    "type": "CNAME",
                    "domain": "email.kayako.com",
                    "expected_value": "email.kayako.com",
                    "actual_values": [
                        "u3381640.wl141.sendgrid.net"
                    ],
                    "is_valid": false,
                    "resource_type": "dns_record"
                },
                {
                    "type": "CNAME",
                    "domain": "s1._domainkey.kayako.com",
                    "expected_value": "s1._domainkey.kayako.com",
                    "actual_values": [
                        "s1.domainkey.u3381640.wl141.sendgrid.net"
                    ],
                    "is_valid": false,
                    "resource_type": "dns_record"
                },
                {
                    "type": "CNAME",
                    "domain": "s2._domainkey.kayako.com",
                    "expected_value": "s2._domainkey.kayako.com",
                    "actual_values": [
                        "s2.domainkey.u3381640.wl141.sendgrid.net"
                    ],
                    "is_valid": false,
                    "resource_type": "dns_record"
                }
            ],
            "resource_type": "mailbox_configuration"
        },
        "resources": [],
        "resource": "mailbox_configuration"
    }`);
  });

  this.put('/api/v1/mailboxes/default', ({ db }, request) => {
    const requestData = JSON.parse(request.requestBody);

    let mailbox = db.mailboxes.find(requestData.mailbox_id);
    mailbox.is_default = true;

    let responseData = db.mailboxes.update(requestData.mailbox_id, mailbox);

    responseData.resource_type = 'mailbox';
    let payload = {
      status: 200,
      data: responseData,
      resource: 'mailbox',
      resources: []
    };
    return new Mirage.Response(200, {}, payload);
  });

  // Account

  this.get('/api/v1/plan', ({ db }) => {
    let { plans } = db;
    let data = plans[plans.length - 1];
    let resources = gatherSideloadedResources(db, data);

    return {
      status: 200,
      resource: 'plan',
      data,
      resources
    };
  });

  this.get('/api/v1/account/subscription', ({ db }) => {
    let data = db.subscriptions[0];
    let resources = gatherSideloadedResources(db, data);

    return {
      status: 200,
      resource: 'subscription',
      data,
      resources
    };
  });

  this.put('/api/v1/account/subscription', ({ db }, { requestBody }) => {
    let attrs = JSON.parse(requestBody);
    let data = server.create('subscription', attrs);
    let resources = gatherSideloadedResources(db, data);

    return {
      status: 200,
      resource_type: 'subscription',
      data,
      resources
    };
  });

  this.post('/api/v1/account/subscription/preview', function(schema, request) {
    return {
      data: {amount: 10, pro_rata: 10}
    };
  });

  this.get('/api/v1/account/creditcards', function() {
    return {
      status: 200
    };
  });

  this.get('/api/v1/account/products', function({ db }, req) {
    let family = req.queryParams.type;
    let data = db.products;

    if (family) {
      data = data.where({ family });
    }

    let resources = gatherSideloadedResources(db, data);

    return {
      status: 200,
      resource: 'product',
      data,
      resources
    };
  });

  this.get('/api/v1/account/products/:product_id/rateplans', ({ db }, { params, queryParams }) => {
    let productId = params.product_id;
    let planType = queryParams.plan_type || 'PRIMARY';
    let data = db.productRateplans
      .filterBy('product.id', productId)
      .filterBy('type', planType);
    let resources = gatherSideloadedResources(db, data);

    return {
      status: 200,
      resource: 'product_rateplan',
      data,
      resources
    };
  });

  this.get('/api/v1/account/rateplans', ({ db }, { queryParams }) => {
    let subscription = db.subscriptions[0];
    let data;

    if (subscription) {
      let ids = subscription.rateplans
        .map(({ id }) => db.rateplans.find(id))
        .mapBy('product_rateplan.id');

      data = db.productRateplans.find(ids);
    } else {
      data = db.productRateplans[0];
    }

    let resources = gatherSideloadedResources(db, data);

    return {
      status: 200,
      resource: 'product_rateplan',
      data,
      resources
    };
  });

  this.get('/api/v1/account/creditcards', function ({ db }, req) {
    return {
      status: 200,
      data: db.creditcards,
      resource: 'creditcard',
      resources: {
        brand: arrayToObjectWithNumberedKeys(db.creditcards)
      }
    };
  });

  this.put('/api/v1/account/creditcards/:id', function ({ db }, req) {
    let creditcard = db.creditcards.find(req.params.id);
    creditcard.is_default = true;
    let responseData = db.creditcards.update(req.params.id, creditcard);
    responseData.resource_type = 'creditcard';
    let payload = {
      status: 200,
      data: responseData,
      resource: 'creditcard',
      resources: []
    };
    return new Mirage.Response(200, {}, payload);
  });

  this.delete('/api/v1/account/creditcards/:id', function ({ db }, req) {
    db.creditcards.remove(req.params.id);
    return { status: 200 };
  });

  this.get('/api/v1/settings', (schema) => {
    return {
      status: 200,
      data: schema.db.settings,
      resource: 'setting',
      resources: []
    };
  });

  this.put('/api/v1/settings', ({ db }, request) => {
    const settings = JSON.parse(request.requestBody).values;
    let errors = [];
    _.each(settings, (value, name) => {
      if (['security.agent.ip_restriction', 'users.email_whitelist', 'users.email_blacklist'].indexOf(name) === -1) {
        if (!value) {
          errors.push({
            code: 'FIELD_INVALID',
            parameter: 'values',
            pointer: `/values/${name}`,
            message: 'The value of the field is invalid',
            more_info: 'http://wiki.kayako.com/display/DEV/REST+v1+-+FIELD_INVALID'
          });
        }
      }
    });

    if (errors.length) {
      return new Mirage.Response(400, {}, {
        status: 400,
        errors
      });
    }

    _.each(settings, (value, name) => {
      db.settings.update(name, { value });
    });


    return {
      status: 200
    };
  });

  this.get('/api/v1/account/invoices', function ({ db }, req) {
    return {
      status: 200,
      data: db.invoices,
      resource: 'invoice'
    };
  });

  this.put('/api/v1/account/subscription/cancel', function ({ db }, req) {
    return {
      status: 200
    };
  });

  this.post('/api/v1/account/creditcards/token', function (schema, req) {
    const data = {signature: 'xxx', token: 'BnTGXVZr1sl5AA6icFBPdL89NQEgmj8H', tenant_id: '1230', key: 'xyzabc'};
    data.resource_type = 'token';
    const token = schema.db.tokens.insert(data);
    return new Mirage.Response(201, {}, {
      status: 201,
      data: token,
      resource: token.resource_type
    });
  });

  this.get('/api/v1/insights/cases/csat', function({ db }, req) {
    return new Mirage.Response(200, {}, insightsCasesCsat);
  });

  this.get('/api/v1/insights/cases/completed', function({ db }, req) {
    return new Mirage.Response(200, {}, insightsCasesCompleted);
  });

  this.get('/api/v1/insights/cases/response', function({ db }, req) {
    return new Mirage.Response(200, {}, insightsCasesResponse);
  });

  this.get('/api/v1/insights/cases/resolution', function({ db }, req) {
    return new Mirage.Response(200, {}, insightsCasesResolution);
  });

  this.get('/api/v1/insights/cases/metrics', function({ db }, req) {
    return new Mirage.Response(200, {}, insightsCasesMetrics);
  });

  this.get('/api/v1/insights/sla/target', function({ db }, req) {
    return new Mirage.Response(200, {}, insightsSlaTarget);
  });
  this.get('/api/v1/insights/sla/overview', function({ db }, req) {
    return new Mirage.Response(200, {}, insightsSlaOverview);
  });
  this.get('/api/v1/insights/sla/performance', function({ db }, req) {
    return new Mirage.Response(200, {}, insightsSlaPerformance);
  });

  this.get('/api/v1/insights/helpcenter/search', function() {
    return new Mirage.Response(200, {}, insightsHelpcenterSearches);
  });

  this.get('/api/v1/insights/helpcenter/articles', function() {
    return new Mirage.Response(200, {}, insightsHelpcenterArticles);
  });

  this.get('/api/v1/events/tokens', function({ db }, req) {
    return {
      status: 200,
      data: db.tokens,
      resource: 'token',
      resources: {}
    };
  });

  this.get('/api/v1/events/tokens/:id', function({ db }, req) {
    let token = db.tokens.find(req.params.id);
    return {
      status: 200,
      data: token,
      resource: 'token',
      resources: {
      }
    };
  });

  this.post('/api/v1/events/tokens', function(schema, req) {
    let data = JSON.parse(req.requestBody);
    data.token = 'abc';
    let token = schema.db.tokens.insert(data);
    return new Mirage.Response(201, {}, {
      status: 201,
      data: token,
      resource: 'token',
      resources: {}
    });
  });

  this.put('/api/v1/events/tokens/:id', function({ db }, req) {
    let data = JSON.parse(req.requestBody);
    delete data.id;
    let token = db.tokens.update(req.params.id, data);
    return {
      status: 200,
      data: token,
      resource: 'token',
      resources: {}
    };
  });

  this.delete('/api/v1/events/tokens/:id', function({ db }, req) {
    db.tokens.remove(req.params.id);
    return { status: 200 };
  });

  this.get('/api/v1/users', function({ db }, req) {
    return {
      status: 200,
      data: db.users,
      resource: 'user',
      resources: {},
      total_count: db.users.length
    };
  });

  this.post('/api/v1/users/invite', function(schema, req) {
    let data = JSON.parse(req.requestBody);
    let errors = data.users.reduce(function(errors, user, index) {
      ['fullname', 'email', 'role_id'].forEach(function(field) {
        if (!user[field]) {
          errors.push({
            code: 'FIELD_EMPTY',
            parameter: 'users',
            pointer: 'users/' + index + '/' + field,
            message: 'The value of the field cannot be empty',
            more_info: 'https://developer.kayako.com/api/v1/reference/errors/FIELD_EMPTY'
          });
        }
      });

      if (!user.team_ids || !user.team_ids.length) {
        errors.push({
          code: 'FIELD_EMPTY',
          parameter: 'users',
          pointer: 'users/' + index + '/team_ids',
          message: 'The value of the field cannot be empty',
          more_info: 'https://developer.kayako.com/api/v1/reference/errors/FIELD_EMPTY'
        });
      }

      return errors;
    }, []);

    if (errors.length) {
      return new Mirage.Response(400, {}, {
        status: 400,
        errors
      });
    }

    return {
      status: 200
    };
  });

  this.get('/api/v1/account', function() {
    return account;
  });

  this.get('/api/v1/twitter/accounts', function({ db }, req) {
    return {
      status: 200,
      data: [],
      resource: 'twitter_account'
    };
  });

  this.get('/api/v1/oauth/my_grants', function({ db }) {
    let id = 1;
    let myGrants = [];
    db.oauthClients.forEach(client => {
      myGrants.push({
        id: id++,
        client: client,
        scopes: [],
        last_activity_at: '2017-02-28T17:43:02+00:00'
      });
    });
    return {
      status: 200,
      data: myGrants,
      resource: 'my_oauth_grant',
      total_count: myGrants.length
    };
  });

  this.delete('/api/v1/oauth/my_grants/:id', function({ db }, req) {
    return { status: 200 };
  });

  this.get('/api/v1/conversations/starter', function({ db }, req) {
    return {
      "status": 200,
      "data": {
        "last_active_agents": [
          {
            "id": 1,
            "resource_type": "user_minimal"
          }
        ],
        "average_reply_time": 2502.2,
        "active_conversations": [],
        "user_email": ""
      },
      resources: {
        user_minimal: {
          1: {
            "id": 1,
            "full_name": "Prasanjit Singh",
            "last_active_at": "2017-06-15T09:27:41+00:00",
            "last_seen_at": "2017-06-15T09:27:41+00:00",
            "avatar": "https://black-dog.kayako.com/avatar/get/a1ce0a31-032a-56f9-a93a-45c96e68599d?1497518861",
            "presence_channel": "",
            "resource_type": "user_minimal"
          }
        }
      },
      resource: "conversation_starter"
    }
  });

  this.get('/api/v1/categories', function({ db }, req) {
    return {
      status: 200,
      data: [{
        id: 1,
        titles: [{
          id: 1,
          locale: 'en-us',
          translation: 'Getting started',
          created_at: '2017-02-09T09:03:22+00:00',
          updated_at: '2017-02-09T09:03:22+00:00',
          resource_type: 'locale_field'
        }],
        brand: {
          id: 1,
          resource_type: 'brand'
        }
      }],
      resources: {},
      resource: 'category'
    };
  });

  this.get('/api/v1/sections', function({ db }, req) {
    return {
      status: 200,
      data: [{
        id: 1
      }],
      total_articles: 1,
      resources: {
        titles: [{
          id: 1,
          locale: 'en-us',
          translation: 'Getting started',
          created_at: '2017-02-09T09:03:22+00:00',
          updated_at: '2017-02-09T09:03:22+00:00',
          resource_type: 'locale_field'
        }],
        slugs: [{
          id: 1,
          locale: 'en-us',
          translation: '1-welcome',
          resource_type: 'slug'
        }],
        category: {
          id: 1,
          title: 'Getting started',
          resource_type: 'category'
        }
      },
      resource: 'section'
    };
  });

  this.get('/api/v1/oauth/clients', ({ db }, req) => {
    return {
      status: 200,
      data: db.oauthClients,
      resource: 'oauth_client',
      total_count: db.oauthClients.length
    };
  });

  this.post('/api/v1/oauth/clients', function({ db }, req) {
    let payload = JSON.parse(req.requestBody);
    payload.id = server.schema.db['oauthClients'].length + 3; //returning an id of 1 or 2 stops the id being updated on the in flight record, someone should investigate this further 🕵️
    payload.key = '23bc6263-eae2-44dd-9aae-52c0b02ffe3c';
    payload.secret = 'MGRkMDUwNjYtYjc3ZC00ZTdiLThlZDgtMmJhYTRkMzVmY2ZkZGZjODJlYjMtYzU1MS00NzVlLTg5NmUtNWJkNTZmMTkxNGNk';

    const newClient = server.create('oauth_client', payload);

    return new Mirage.Response(201, {}, {
      status: 201,
      data: newClient,
      resource: newClient.resource_type,
      resources: []
    });
  });

  this.get('/api/v1/oauth/clients/:id', function({ db }, req) {
    const client = db.oauthClients.find(req.params.id);
    return {
      status: 200,
      data: client,
      resource: 'oauth_client'
    };
  });

  this.put('/api/v1/oauth/clients/:id', function({ db }, req) {
    const id = req.params.id;
    const attrs = JSON.parse(req.requestBody);
    const client = db.oauthClients.update(id, attrs);
    return {
      status: 200,
      data: client,
      resource: 'oauth_client'
    };
  });

  this.delete('/api/v1/oauth/clients/:id', function({ db }, req) {
    db.oauthClients.remove(req.params.id);
    return { status: 200 };
  });

  this.get('/api/v1/profile/twofactor', function({ db }, req) {
    return { status: 200 };
  });

  this.put('/api/v1/profile/password', function({ db }, req) {
    return { status: 200 };
  });

  this.put('/api/v1/cases/posts/:id', (schema, req) => {
    return {
      status: 200
    };
  });

  this.get('/api/v1/authentication/scheme', ({ db }) => {
    return {
      status: 200,
      resource: 'scheme',
      data: {
        agent: db.authProviders
      }
    };
  });

  this.get('/api/v1/timetracking/tracked', ({ db }, req) => {
    let { case_id: id } = req.queryParams;
    let data = db.timetrackingTrackeds.find(id);
    if (!data) {
      data = server.create('timetracking-tracked', { id });
    }
    // Lazily generate the list of entries on the fly
    data.entries = db.timetrackingLogs.where({ case_id: id }).map(rel);
    let resources = gatherSideloadedResources(db, data);

    return {
      status: 200,
      resource: 'timetracking_tracked',
      data,
      resources
    };
  });

  this.get('/api/v1/timetracking/activity', ({ db }, req) => {
    let { case_id } = req.queryParams;
    let data = db.timetrackingActivities.where({ case_id });
    let resources = gatherSideloadedResources(db, data);

    return {
      status: 200,
      resource: 'timetracking_activity',
      data,
      resources
    };
  });

  this.post('/api/v1/timetracking', ({ db }, req) => {
    let attrs = JSON.parse(req.requestBody);

    let caseId = attrs.case_id;
    delete attrs.case_id;
    let kase = caseId && db.cases.find(caseId);
    if (kase) {
      attrs.case = rel(kase);
    }

    let agentId = attrs.agent_id;
    delete attrs.agent_id;
    let agent = agentId && db.users.find(agentId);
    if (agent) {
      attrs.agent = rel(agent);
    }

    let creatorId = attrs.creator_id || agentId;
    delete attrs.creator_id;
    let creator = creatorId && db.users.find(creatorId);
    if (creator) {
      attrs.creator = rel(creator);
    }

    let data = server.create('timetracking-log', attrs);
    let resources = gatherSideloadedResources(db, data);

    return {
      status: 200,
      resource: 'timetracking_log',
      data,
      resources
    };
  });

  this.put('/api/v1/timetracking/:id', ({ db }, req) => {
    let { id } = req.params;
    let attrs = JSON.parse(req.requestBody);

    db.timetrackingLogs.update(id, attrs);

    let data = db.timetrackingLogs.find(id);
    let resources = gatherSideloadedResources(db, data);

    return {
      status: 200,
      resource: 'timetracking_log',
      data,
      resources
    };
  });

  this.delete('/api/v1/timetracking/:id', ({ db }, req) => {
    let { id } = req.params;

    db.timetrackingLogs.remove(id);

    return { status: 200 };
  });

  this.get('/api/v1/notifications', () => {
    return { status: 200, data: [], resource: 'notification' };
  });

  this.get('/api/v1/notification_preferences', () => {
    return {
      status: 200,
      data: notificationPreferences,
      resource: 'notification_preference',
      resources: []
    };
  });


  this.get('/api/v1/privacy', ({ db }) => {
    const client = db.privacyPolicies;
    return {
      status: 200,
      data: client,
      resource: 'privacy-policy',
      resources: []
    };
  });

  this.get('/api/v1/privacy/:id', ({ db }, req) => {
    const client = db.privacyPolicies.find(req.params.id);
    return {
      status: 200,
      data: client,
      resource: 'privacy-policy'
    };
  });

  this.post('/api/v1/privacy/', ({ db }, req) => {
    const data = JSON.parse(req.requestBody);
    const newPrivacy = db.privacyPolicies.insert(data);
    return {
      status: 201,
      data: newPrivacy,
      resource: 'privacy-policy',
      resources: []
    };
  });

  this.put('/api/v1/privacy/:id', ({ db }, req) => {
    const { id } = req.params;
    const attrs = JSON.parse(req.requestBody);
    const data = db.privacyPolicies.update(id, attrs);

    return {
      status: 200,
      data: data,
      resource: 'privacy-policy',
      resources: []
    };
  });

  this.get('/api/v1/profile/preferences', () => {
    return {
      data: {
        desktop_sound_alerts: false,
        desktop_sound_alerts_realtime_only: false
      },
      status: 200,
      resource: 'user_preferences',
      resources: []
    };
  });

  this.get('/api/v1/cases/posts/:id/email_original', ({ db }, req) => {
    //return new Mirage.Response(500, {}, {
      //status: 500,
      //errors: [
        //{
          //code: 'ACTION_FAILED',
          //message: 'The server failed to perform this action for unknown internal reason'
        //}
      //]
    //});

    //return new Mirage.Response(404, {}, {
      //status: 404,
      //errors: [
        //{
          //code: 'RESOURCE_NOT_FOUND',
          //message: 'Resource does not exist or has been removed'
        //}
      //]
    //});

    let email = db.emailOriginals.find(req.params.id);

    return new Mirage.Response(200, {}, {
      status: 200,
      data: email,
      resource: 'email_original',
      resources: { }
    });
  });

  this.post('/api/v1/cases/:id/merge', ({ db }, request) => {
    let payload = JSON.parse(request.requestBody);
    let primaryId = request.params.id;
    let auxiliaryIds = payload.case_ids.split(',');
    let caseIds = [primaryId, ...auxiliaryIds];
    let cases = db.cases.find(caseIds);
    let [primary, ...auxiliaries] = cases.sortBy('created_at');

    // Perform a crude simulation of merge
    auxiliaries.forEach(aux => db.cases.remove(aux));

    let status = 200;
    let resource = 'case';
    let data = primary;
    let resources = gatherSideloadedResources(db, data);

    return { status, resource, data, resources };
  });

  this.get('/api/v1/cases', () => {
    return {
      status: 200,
      data: [
          {
              id: 1234,
              resource_type: 'case'
          }
      ],
      resources: [],
      resource: 'case'
    };
  });

  // Apps

  this.get('https://apps.kayako.net/api/v1/app-installations', () => {
    return {
      data: []
    };
  });

  this.get('https://apps.kayako.net/api/v1/apps', () => {
    return {
      data: []
    };
  });

  this.get('/api/v1/endpoints', function () {
    return {
      "status": 200,
      "data": [
        {
          "id": 1,
          "title": "Test with None Authentication",
          "type": "HTTP",
          "attributes": [
            {
              "name": "auth_method",
              "value": "none",
              "resource_type": "endpoint_attribute"
            },
            {
              "name": "auth_password",
              "value": null,
              "resource_type": "endpoint_attribute"
            },
            {
              "name": "auth_username",
              "value": null,
              "resource_type": "endpoint_attribute"
            },
            {
              "name": "method",
              "value": "GET",
              "resource_type": "endpoint_attribute"
            },
            {
              "name": "url",
              "value": "https://google.com",
              "resource_type": "endpoint_attribute"
            }
          ],
          "is_enabled": true,
          "last_attempt_result": null,
          "last_attempt_message": null,
          "last_attempt_at": null,
          "resource_type": "endpoint",
        },
        {
          "id": 2,
          "title": "Test with Basic Auth",
          "type": "HTTP",
          "attributes": [
            {
              "name": "auth_method",
              "value": "basic",
              "resource_type": "endpoint_attribute"
            },
            {
              "name": "auth_password",
              "value": "Test@123",
              "resource_type": "endpoint_attribute"
            },
            {
              "name": "auth_username",
              "value": "test@devfactory.com",
              "resource_type": "endpoint_attribute"
            },
            {
              "name": "content_type",
              "value": "FORM",
              "resource_type": "endpoint_attribute"
            },
            {
              "name": "method",
              "value": "POST",
              "resource_type": "endpoint_attribute"
            },
            {
              "name": "url",
              "value": "https://google.com",
              "resource_type": "endpoint_attribute"
            },
            {
              "name": "use_auth",
              "value": "1",
              "resource_type": "endpoint_attribute"
            },
            {
                "name": "custom_headers",
                "value": "{\"abcd_key\":\"abcd_value\",\"sdfds_key\":\"sdfds_value\",\"pqrs_key\":\"pqrs_value\"}",
                "resource_type": "endpoint_attribute"
            }
          ],
          "is_enabled": true,
          "last_attempt_result": null,
          "last_attempt_message": null,
          "last_attempt_at": null,
          "resource_type": "endpoint",
        },
        {
          "id": 3,
          "title": "Test Bearer Token",
          "type": "HTTP",
          "attributes": [
            {
              "name": "auth_bearer_token",
              "value": "bearer_token_XYZV",
              "resource_type": "endpoint_attribute"
            },
            {
              "name": "auth_method",
              "value": "bearer",
              "resource_type": "endpoint_attribute"
            },
            {
              "name": "auth_password",
              "value": null,
              "resource_type": "endpoint_attribute"
            },
            {
              "name": "auth_username",
              "value": null,
              "resource_type": "endpoint_attribute"
            },
            {
              "name": "content_type",
              "value": "JSON",
              "resource_type": "endpoint_attribute"
            },
            {
              "name": "method",
              "value": "PUT",
              "resource_type": "endpoint_attribute"
            },
            {
              "name": "url",
              "value": "https://google-test.com",
              "resource_type": "endpoint_attribute"
            },
            {
              "name": "use_auth",
              "value": null,
              "resource_type": "endpoint_attribute"
            },
            {
                "name": "custom_headers",
                "value": "{\"poiu_key\":\"\",\"tyui_key\":\"tyui_value\"}",
                "resource_type": "endpoint_attribute"
            }
          ],
          "is_enabled": true,
          "last_attempt_result": null,
          "last_attempt_message": null,
          "last_attempt_at": null,
          "resource_type": "endpoint",
        },
        {
          "id": 4,
          "title": "Test API Key",
          "type": "HTTP",
          "attributes": [
            {
              "name": "auth_api_key",
              "value": "test_key_1234",
              "resource_type": "endpoint_attribute"
            },
            {
              "name": "auth_api_value",
              "value": "test_value_2345",
              "resource_type": "endpoint_attribute"
            },
            {
              "name": "auth_method",
              "value": "apikey",
              "resource_type": "endpoint_attribute"
            },
            {
              "name": "auth_password",
              "value": null,
              "resource_type": "endpoint_attribute"
            },
            {
              "name": "auth_username",
              "value": null,
              "resource_type": "endpoint_attribute"
            },
            {
              "name": "content_type",
              "value": "XML",
              "resource_type": "endpoint_attribute"
            },
            {
              "name": "method",
              "value": "PATCH",
              "resource_type": "endpoint_attribute"
            },
            {
              "name": "url",
              "value": "https://google-test.com",
              "resource_type": "endpoint_attribute"
            },
            {
              "name": "use_auth",
              "value": null,
              "resource_type": "endpoint_attribute"
            }
          ],
          "is_enabled": true,
          "last_attempt_result": null,
          "last_attempt_message": null,
          "last_attempt_at": null,
          "resource_type": "endpoint",
        }
      ],
      "resources": [],
      "resource": "endpoint",
      "offset": 0,
      "limit": 10,
      "total_count": 4,
    };
  });
}
