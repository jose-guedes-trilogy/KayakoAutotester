import rowStyles from 'frontend-cp/components/ko-simple-list/row/styles';

export const getEnabledRows = () => find(`.qa-brands-enabled .${rowStyles.row}`);
export const getDisabledRows = () => find(`.qa-brands-disabled .${rowStyles.row}`);

export const assertRow = (assert, row, [name, domain, options = []]) => {
  assert.ok(row.text().indexOf(name) !== -1, 'Name is correct');

  const isDefault = options.indexOf('isDefault') !== -1;
  assert[isDefault ? 'ok' : 'notOk'](row.text().indexOf('(Default)') !== -1, name + ': (Default)');

  triggerEvent(row, 'mouseenter');
  andThen(() => {
    const canEdit = options.indexOf('canEdit') !== -1;
    assert[canEdit ? 'ok' : 'notOk'](row.find('a').text().indexOf('Edit') !== -1, name + ': Can be edited');

    const canDisable = options.indexOf('canDisable') !== -1;
    assert[canDisable ? 'ok' : 'notOk'](row.find('a').text().indexOf('Disable') !== -1, name + ': Can be disabled');

    const canEnable = options.indexOf('canEnable') !== -1;
    assert[canEnable ? 'ok' : 'notOk'](row.find('a').text().indexOf('Enable') !== -1, name + ': Can be enabled');

    const canMakeDefault = options.indexOf('canMakeDefault') !== -1;
    assert[canMakeDefault ? 'ok' : 'notOk'](row.find('a').text().indexOf('Make default') !== -1, name + ': Can be made default');

    const canDelete = options.indexOf('canDelete') !== -1;
    assert[canDelete ? 'ok' : 'notOk'](row.find('a').text().indexOf('Delete') !== -1, name + ': Can be removed');
  });
  triggerEvent(row, 'mouseleave');
};

export const assertRows = (assert, enabled = [], disabled = []) => {
  const enabledRows = getEnabledRows();
  const disabledRows = getDisabledRows();
  assert.equal(enabledRows.length, enabled.length, 'Enabled brand count');
  assert.equal(disabledRows.length, disabled.length, 'Disabled brand count');

  enabled.forEach((row, index) => assertRow(assert, enabledRows.eq(index), row));
  disabled.forEach((row, index) => assertRow(assert, disabledRows.eq(index), row));
};
