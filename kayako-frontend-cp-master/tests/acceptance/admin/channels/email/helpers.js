import rowStyles from 'frontend-cp/components/ko-simple-list/row/styles';

export const getEnabledRows = () => find(`.qa-mailboxes-enabled .${rowStyles.row}`);
export const getDisabledRows = () => find(`.qa-mailboxes-disabled .${rowStyles.row}`);

export const assertRow = (assert, row, [address, options = [], hash = {}]) => {
  assert.ok(row.text().indexOf(address) !== -1, address + ' (Mailbox address)');
  const brand = hash.brand || 'Main Brand';
  assert.ok(row.text().indexOf(`(${brand})`) !== -1, address + ' (Main Brand)');

  const isDefault = options.indexOf('isDefault') !== -1;
  assert[isDefault ? 'ok' : 'notOk'](row.text().indexOf('(Default)') !== -1, address + ' (Default)');
  triggerEvent(row, 'mouseenter');
  andThen(() => {
    const canEdit = options.indexOf('canEdit') !== -1;
    assert[canEdit ? 'ok' : 'notOk'](row.text().indexOf('Edit') !== -1, address + ' Editable');

    const canDisable = options.indexOf('canDisable') !== -1;
    assert[canDisable ? 'ok' : 'notOk'](row.text().indexOf('Disable') !== -1, address + ' Can be disabled');

    const canMakeDefault = options.indexOf('canMakeDefault') !== -1;
    assert[canMakeDefault ? 'ok' : 'notOk'](row.text().indexOf('Make default') !== -1, address + ' Can be made default');

    const canEnable = options.indexOf('canEnable') !== -1;
    assert[canEnable ? 'ok' : 'notOk'](row.text().indexOf('Enable') !== -1, address + ' Can be enabled');

    const canDelete = options.indexOf('canDelete') !== -1;
    assert[canDelete ? 'ok' : 'notOk'](row.text().indexOf('Delete') !== -1, address + ' Can be deleted`');
  });
  triggerEvent(row, 'mouseleave');
};

export const assertRows = (assert, enabled = [], disabled = []) => {
  const enabledRows = getEnabledRows();
  const disabledRows = getDisabledRows();
  assert.equal(enabledRows.length, enabled.length, 'Enabled mailbox count');
  assert.equal(disabledRows.length, disabled.length, 'Disabled mailbox count');

  enabled.forEach((row, index) => assertRow(assert, enabledRows.eq(index), row));
  disabled.forEach((row, index) => assertRow(assert, disabledRows.eq(index), row));
};
