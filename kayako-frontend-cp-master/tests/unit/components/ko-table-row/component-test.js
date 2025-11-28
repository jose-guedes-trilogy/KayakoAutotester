// import { moduleForComponent, test } from 'frontend-cp/tests/helpers/qunit';
// import Ember from 'ember';
//
// let component;
// let table;
// let body;
//
// moduleForComponent('ko-table/row', 'Unit | Component | ko table row', {
//   // Specify the other units that are required for this test
//   needs: ['component:ko-checkbox'],
//   setup() {
//     component = this.subject();
//     table = Ember.Object.create({
//       send() {}
//     });
//     body = Ember.Object.create({
//       table: table
//     });
//     component.set('parentView', body);
//   }
// });
//
// test('it renders', function(assert) {
//   assert.expect(2);
//
//   // Creates the component instance
//   assert.equal(component._state, 'preRender');
//
//   // Renders the component to the page
//   this.render();
//   assert.equal(component._state, 'inDOM');
// });
//
// test('it is selectable whenever the table is', function (assert) {
//   this.render();
//   assert.equal(this.$('td').length, 0);
//
//   Ember.run(() => {
//     table.set('selectable', true);
//   });
//
//   assert.equal(this.$('td').length, 1);
// });
//
// test('it emits registerRow on the table when inserted into dom', function (assert) {
//   assert.expect(2);
//
//   table.set('send', (action, row) => {
//     assert.equal(action, 'registerRow');
//     assert.equal(row, component);
//     table.set('send', () => {});
//   });
//
//   this.render();
// });
//
// test('it emits unregisterRow on the table when removed from dom', function (assert) {
//   assert.expect(2);
//   this.render();
//
//   table.set('send', (action, row) => {
//     assert.equal(action, 'unregisterRow');
//     assert.equal(row, component);
//   });
// });
