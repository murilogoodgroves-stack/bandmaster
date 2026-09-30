import assert from 'node:assert/strict';
import {
  STORAGE_VERSION,
  makeEqualSplit,
  resolveValidBandId,
  resolveValidUserId,
  sanitizeBandScopedList,
} from '../state/appStateIntegrity';

const bands = [{ id: 'band-a' }, { id: 'band-b' }];
assert.equal(resolveValidBandId(bands, 'missing-band'), 'band-a');
assert.equal(resolveValidBandId(bands, 'band-b'), 'band-b');

const users = [{ id: 'u1' }, { id: 'u2' }, { id: 'u3' }];
assert.equal(resolveValidUserId(users, 'missing-user'), 'u1');
assert.equal(resolveValidUserId(users, 'u2'), 'u2');

const splits = makeEqualSplit(['u1', 'u2', 'u3']);
assert.deepEqual(splits, { u1: 33.333333333333336, u2: 33.333333333333336, u3: 33.333333333333336 });

const records = [
  { bandId: 'band-a', label: 'valid' },
  { bandId: 'ghost-band', label: 'orphan' },
  { label: 'missing-band-id' },
];
const cleaned = sanitizeBandScopedList(records, new Set(['band-a']));
assert.equal(cleaned.length, 2);
assert.equal(cleaned[0].label, 'valid');
assert.equal(cleaned[1].label, 'missing-band-id');
assert.equal(STORAGE_VERSION, 'v2');

console.log('State integrity validation passed');
