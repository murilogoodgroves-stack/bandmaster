import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { saveAppStateSnapshot, loadAppStateSnapshot } from './db';

describe('app state persistence helpers', () => {
  it('should save and load a snapshot payload from the configured database', async () => {
    const key = 'test-app-state-sync';
    const payload = { bands: [{ id: 'b-test', name: 'Test Band' }], users: [] };

    const saved = await saveAppStateSnapshot(key, payload);
    assert.equal(saved?.key, key);

    const loaded = await loadAppStateSnapshot(key);
    assert.deepEqual(loaded, payload);
  });
});
