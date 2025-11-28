// import { moduleForComponent, test } from 'frontend-cp/tests/helpers/qunit';
// import Ember from 'ember';
//
// let component;
// let table;
//
// moduleForComponent('ko-table/header', 'Unit | Component | ko table header', {
//   // Specify the other units that are required for this test
//   needs: ['component:ko-checkbox'],
//   setup() {
//     component = this.subject();
//     table = Ember.Object.create();
//     component.set('parentView', table);
//   }
// });
//
// test('it renders', function (assert) {
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
// test('it doesn\'t have a checkbox by default', function (assert) {
//   assert.equal(this.$('th').length, 0);
// });
//
// test('it displays a checkbox when table\'s selectable=true', function (assert) {
//   Ember.run(() => {
//     table.set('selectable', true);
//   });
//   assert.equal(this.$('th').length, 1);
// });
//
// test('it emits an action on the table when checkbox is clicked', function (assert) {
//   assert.expect(2);
//   Ember.run(() => {
//     table.set('selectable', true);
//   });
//
//   table.set('send', (action) => {
//     assert.equal(action, 'selectAll');
//   });
//
//   Ember.run(() => {
//     component.send('selectAll', true);
//   });
//
//   table.set('send', (action) => {
//     assert.equal(action, 'deselectAll');
//   });
//
//   Ember.run(() => {
//     component.send('selectAll', false);
//   });
// });
//
// test('it modifies sorting order and column and emits an action when sorted', function (assert) {
//   assert.expect(14);
//   component.set('onSort', 'onSort');
//
//   // initial values
//   assert.equal(component.get('sortColumn'), '');
//   assert.equal(component.get('sortOrder'), '');
//
//   // initial sort
//   component.set('targetObject', {
//     onSort(sortColumn, sortOrder) {
//       assert.equal(sortColumn, 'foo');
//       assert.equal(sortOrder, 'asc');
//     }
//   });
//   component.send('sort', 'foo');
//   assert.equal(component.get('sortColumn'), 'foo');
//   assert.equal(component.get('sortOrder'), 'asc');
//
//   // desc sort
//   component.set('targetObject', {
//     onSort(sortColumn, sortOrder) {
//       assert.equal(sortOrder, 'desc');
//     }
//   });
//   component.send('sort', 'foo');
//   assert.equal(component.get('sortOrder'), 'desc');
//
//   // back to asc
//   component.set('targetObject', {
//     onSort(sortColumn, sortOrder) {
//       assert.equal(sortOrder, 'asc');
//     }
//   });
//   component.send('sort', 'foo');
//   assert.equal(component.get('sortOrder'), 'asc');
//
//   // different column
//   component.set('targetObject', {
//     onSort(sortColumn, sortOrder) {
//       assert.equal(sortColumn, 'bar');
//       assert.equal(sortOrder, 'asc');
//     }
//   });
//   component.send('sort', 'bar');
//   assert.equal(component.get('sortColumn'), 'bar');
//   assert.equal(component.get('sortOrder'), 'asc');
// });
