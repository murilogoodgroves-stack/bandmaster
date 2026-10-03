import test from 'node:test';
import assert from 'node:assert/strict';
import { removeClientStoredSecrets } from './snapshotSecurity';

test('removes browser-stored Mailchimp credentials before remote persistence', () => {
  const snapshot = {
    bands: [{ id: 'band-1' }],
    bandSettingsMap: {
      'band-1': { issuerName: 'Band', mailchimpApiKey: 'private-key', mailchimpAudienceId: 'audience' },
      'band-2': { issuerName: 'Other', mailchimpApiKey: 'other-private-key' },
    },
  };

  const sanitized = removeClientStoredSecrets(snapshot);
  assert.deepEqual(sanitized.bandSettingsMap, {
    'band-1': { issuerName: 'Band', mailchimpAudienceId: 'audience' },
    'band-2': { issuerName: 'Other' },
  });
  assert.equal(snapshot.bandSettingsMap['band-1'].mailchimpApiKey, 'private-key');
});

test('preserves unrelated snapshot data and malformed settings safely', () => {
  const snapshot = { bands: [], bandSettingsMap: { invalid: null } };
  assert.deepEqual(removeClientStoredSecrets(snapshot), snapshot);
});
