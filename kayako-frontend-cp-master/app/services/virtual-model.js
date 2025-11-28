import Service, { inject as service } from '@ember/service';
import EmberObject, { set, get } from '@ember/object';
import _ from 'npm:lodash';

const { map, every } = _;

export const list = () => ({ type: 'array' });
export const attr = options => ({ type: 'attribute', options });
export const many = schema => ({ type: 'many', schema });
// export const one = schema => ({ type: 'one', schema }); // TODO
export const model = (typeName, schema) => ({ type: 'model', typeName, schema });
export const fragment = (typeName, schema) => ({ type: 'fragment', typeName, schema });

const isPromise = model => model && (model.isFulfilled === false || model.isFulfilled === true);
const getPromiseContents = model => isPromise(model) ? model.get('content') : model;

const deepEquals = ({ type, schema, options }, left, right) => {
  if (type === 'model' || type === 'fragment') {
    return every(map(schema, (childSchema, attribute) =>
      deepEquals(childSchema, get(left, attribute), get(right, attribute))
    ));
  } else if (type === 'attribute') {
    if (options && options.nonStrictMatching) {
      return left === right || (!left && !right);
    } else {
      return getPromiseContents(left) === getPromiseContents(right);
    }
  } else if (type === 'many') {
    return get(left, 'length') === get(right, 'length') && every(left.map((el, index) => deepEquals(schema, el, right.objectAt(index))));
  } else if (type === 'array') {
    return get(left, 'length') === get(right, 'length') && every(left.map((el, index) => el === right.objectAt(index)));
  }
};

export const isEdited = (original, changed, schema) => {
  return !deepEquals(schema, original, changed);
};

export default Service.extend({
  store: service(),

  makeSnapshot(model, { type, schema } = {}) {
    if (type === 'model' || type === 'fragment') {
      let object = EmberObject.create();
      _.forEach(schema, (childSchema, key) => {
        object.set(key, this.makeSnapshot(get(model, key), childSchema));
      });
      return object;
    } else if (type === 'attribute') {
      return getPromiseContents(model);
    } else if (type === 'many') {
      return model.map(item => this.makeSnapshot(item, schema));
    } else if (type === 'array') {
      return model.slice(0);
    }
  },

  patch(model, changedData, { type, schema }) {
    const store = get(this, 'store');
    if (type === 'model' || type === 'fragment') {
      _.forEach(schema, (childSchema, key) => {
        const newAttribute = this.patch(get(model, key), get(changedData, key), childSchema);
        // workaround against not being able to do model.set('children', model.get('children'))`
        if (childSchema.type !== 'many') {
          set(model, key, newAttribute);
        }
      });
      return model;
    } else if (type === 'attribute') {
      return changedData;
    } else if (type === 'many' && schema.type === 'model') {
      model.toArray().forEach(el => {
        const updated = schema.schema.id ?
          changedData.find(el2 => el2.id && el2.id === get(el, 'id')) :
          null;
        if (updated) {
          this.patch(el, updated, schema);
        } else {
          el.deleteRecord();
          // model.removeObject(el);
        }
      });
      const added = schema.schema.id ?
        changedData.reject(el => model.find(el2 => el2.id && get(el2, 'id') === el.id)) :
        changedData;
      added.forEach(newRecord => {
        const record = store.createRecord(schema.typeName);
        this.patch(record, newRecord, schema);
        model.pushObject(record);
      });
      return model;
    } else if (type === 'many' && schema.type === 'fragment') {
      model.toArray().forEach(fragment => model.removeObject(fragment));
      changedData.forEach(record => {
        const fragment = store.createFragment(schema.typeName);
        this.patch(fragment, record, schema);
        model.pushObject(fragment);
      });
      return model;
    } else if (type === 'many' && schema.type === 'attribute') {
      model.clear();
      changedData.forEach(item => model.pushObject(item));
    } else if (type === 'array') {
      return changedData.slice(0);
    }
  },

  save(model, editedModel, schema, adapterOptions) {
    const original = this.makeSnapshot(model, schema);

    this.patch(model, editedModel, schema);

    return model.save(adapterOptions).then(() => {
      return this.makeSnapshot(model, schema);
    }).catch((error) => {
      this.copyErrors(model, editedModel);
      this.patch(model, original, schema);
      throw error;
    });
  },

  copyErrors(model, editedModel) {
    if (!model.get('errors.errorsByAttributeName')) {
      // can happen if model isn't an EmberData model
      return;
    }
    const attributeErrors = model.get('errors.errorsByAttributeName').copy();
    const copiedErrors = EmberObject.create();
    attributeErrors.forEach((attrErrors, attribute) => {
      copiedErrors.set(attribute, attrErrors.map(message => message));
    });
    editedModel.set('errors', copiedErrors);
  }
});
