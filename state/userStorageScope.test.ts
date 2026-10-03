import test from 'node:test';
import assert from 'node:assert/strict';
import { userScopedStorageKey } from './userStorageScope';

test('keeps local development keys compatible with existing browser data', () => {
  assert.equal(userScopedStorageKey('bands', null), 'bands');
});

test('namespaces authenticated storage by encoded account id', () => {
  assert.equal(userScopedStorageKey('bands', 'user@example.com'), 'bandmate:user:user%40example.com:bands');
});

test('isolates the same browser state key between accounts', () => {
  assert.notEqual(userScopedStorageKey('bands', 'account-a'), userScopedStorageKey('bands', 'account-b'));
});
