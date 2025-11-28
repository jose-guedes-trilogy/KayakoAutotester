// AI-GEN START - Cursor and GPT4
import { moduleFor, test } from 'ember-qunit';

moduleFor('route:session/agent/cases/case', 'Unit | Route | session/agent/cases/case', {
    needs: [],
    beforeEach() {
        this.register('service:metrics', {});
        this.register('service:url', {});
        this.register('service:i18n', {});
        this.register('service:socket', {});
        this.register('service:processManager', {});
        this.register('service:tabStore', {});
    }
});

test('it exists', function (assert) {
    let route = this.subject();
    assert.ok(route);
});

test('it hard reloads the case from cache when model method is called', async function (assert) {
    assert.expect(5);

    let route = this.subject();

    // Mock case object
    let caseObj = {
        id: 'case1',
        name: 'Test Case'
    };

    // Mock store with overridden findRecord method
    route.set('store', {
        findRecord(modelName, id, options) {
            assert.equal(modelName, 'case', 'The model name should be "case"');
            assert.equal(id, 'case1', 'The id should be "case1"');
            assert.deepEqual(options, { reload: true }, 'The options should indicate a hard reload');

            return Ember.RSVP.resolve({
                hasMany() {
                    return {
                        reload() {
                            return {
                                then() { 
                                    return caseObj;
                                }
                            };
                        }
                    };
                }
            });
        }
    });

    // Call the model method manually and verify its behavior
    let caseRecord = await route.model({ case_id: 'case1' });

    assert.equal(caseRecord.id, 'case1', 'The ID should match the requested one');
    assert.equal(caseRecord.name, 'Test Case', 'The name of the case should be updated');
});
// AI-GEN END
