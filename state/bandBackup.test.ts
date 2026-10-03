import assert from 'node:assert/strict';
import test from 'node:test';
import { bandBackupListKeys, bandBackupMapKeys, parseBandBackup } from './bandBackup';

test('backup key lists include app state collections and per-band settings', () => {
  assert.ok(bandBackupListKeys.includes('memberTransactions'));
  assert.ok(bandBackupListKeys.includes('emailTemplates'));
  assert.ok(bandBackupListKeys.includes('savedFundingOpps'));
  assert.ok(bandBackupListKeys.includes('savedResidencies'));
  assert.ok(bandBackupListKeys.includes('articles'));
  assert.ok(!bandBackupListKeys.some(key => String(key) === 'publishedArticles'));
  assert.ok(bandBackupMapKeys.includes('bandSettingsMap'));
});

test('parses current and legacy-shaped backups', () => {
  const backup = { bandProfile: { id: 'band-source', name: 'Example Band' }, data: { tasks: [] } };
  assert.equal(parseBandBackup(backup).bandProfile.id, 'band-source');
  assert.equal(parseBandBackup({ ...backup, exportFormatVersion: 2 }).exportFormatVersion, 2);
  assert.deepEqual(parseBandBackup({
    ...backup,
    data: { publishedArticles: [{ id: 'article-1', bandId: 'band-source' }] },
  }).data.articles, [{ id: 'article-1', bandId: 'band-source' }]);
});

test('rejects malformed or unsupported backups before import', () => {
  assert.throws(() => parseBandBackup(null), /band profile and data/);
  assert.throws(() => parseBandBackup({ bandProfile: { id: '', name: 'Band' }, data: {} }), /ID and name/);
  assert.throws(() => parseBandBackup({
    exportFormatVersion: 3,
    bandProfile: { id: 'band-source', name: 'Band' },
    data: {},
  }), /not supported/);
  assert.throws(() => parseBandBackup({
    bandProfile: { id: 'band-source', name: 'Band' },
    data: { tasks: { id: 'not-a-list' } },
  }), /"tasks" must be a list/);
  assert.throws(() => parseBandBackup({
    bandProfile: { id: 'band-source', name: 'Band' },
    data: { tasks: Array.from({ length: 10001 }, () => ({})) },
  }), /10,000 items/);
  assert.throws(() => parseBandBackup({
    bandProfile: { id: 'band-source', name: 'Band' },
    data: { cashOnHandMap: { amount: 10 } },
  }), /"cashOnHandMap" has an unsupported value/);
});
