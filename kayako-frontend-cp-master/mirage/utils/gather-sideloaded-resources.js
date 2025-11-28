import Ember from 'ember';
const { pluralize, camelize } = Ember.String;

export default function gatherSideloadedResources(serverOrDB, sourceOrSources) {
  if (!serverOrDB) {
    throw new Error('You tried to call gatherSideloadedResources without passing server or db');
  }

  if (!sourceOrSources) {
    throw new Error('You tried to call gatherSideloadedResources without any sources');
  }

  let db = serverOrDB.db || serverOrDB;
  let sources = sourceOrSources.forEach ? sourceOrSources : [sourceOrSources];
  let result = {};

  sources.forEach(source => {
    try {
      processResource(db, source, result);
    } catch(error) {
      error.message = `Cannot sideload resources for ${source.resource_type}(${source.id})\n  -> ${error.message}`;
      throw error;
    }
  });

  return result;
}

function processResource(db, resource, result) {
  try {
    processFields(db, resource, result);
  } catch (error) {
    error.message = `${resource.resource_type}(${resource.id})\n  -> ${error.message}`;
    throw error;
  }
}

function processFields(db, resource, result) {
  Object.keys(resource).forEach(key => {
    try {
      processField(db, resource[key], result);
    } catch(error) {
      error.message = `.${key}\n  -> ${error.message}`;
      throw error;
    }
  });
}

function processField(db, field, result) {
  if (!field) { return; }

  if (field.resource_type) {
    processRelationship(db, field, result);
  }

  // there are fields called object that are (as the name suggests) objects not relationships
  // but they can contain relationships under the original field
  if (field.original && field.original.resource_type) {
    processRelationship(db, field.original, result);
  }

  if (field.forEach) {
    field.forEach(subField => {
      processField(db, subField, result);
    });
  }
}

function processRelationship(db, relationship, result) {
  let { id, resource_type: type } = relationship;

  if (!id) {
    // If there’s no id then this is conceptually a "fragment" and is always
    // included inline in full, rather than sideloaded.
    return;
  }

  let collectionName = camelize(pluralize(type));
  let collection = db[collectionName];

  if (!collection) {
    // If there’s no collection then this is probably also a "fragment" though
    // it is probably not correct that it has an id (the real API would not).
    //
    // There is also the special case of our mirage factory "feature" which
    // should really be called "product-feature". Even so, it is actually
    // a fragment and probably shouldn’t have its own factory.
    //
    console.warn(`Cannot find collection for relationship: ${JSON.stringify(relationship)} (Expected db.${collectionName})`); // eslint-disable-line no-console
    return;
  }

  let relatedResource = collection.find(id);

  if (!relatedResource) {
    throw new Error(`Cannot find resource for relationship: ${JSON.stringify(relationship)}`);
  }

  result[type] = result[type] || {};
  result[type][id] = relatedResource;

  processResource(db, relatedResource, result);
}
