import test from 'node:test';
import assert from 'node:assert/strict';

import { canShowBandSetupPrompt, canSyncRemoteState, shouldUseRemoteState } from './appStateHydration.ts';

test('does not open the onboarding wizard while remote state is still hydrating', () => {
  assert.equal(canShowBandSetupPrompt(0, true), false);
});

test('opens the onboarding wizard only after hydration finishes and the state is empty', () => {
  assert.equal(canShowBandSetupPrompt(0, false), true);
  assert.equal(canShowBandSetupPrompt(1, false), false);
});

test('prefers the online database whenever it is configured and returns a valid snapshot', () => {
  assert.equal(shouldUseRemoteState(true, true, true), true);
  assert.equal(shouldUseRemoteState(false, true, false), false);
  assert.equal(shouldUseRemoteState(true, false, true), false);
});

test('does not sync local defaults until remote configuration and hydration are trusted', () => {
  assert.equal(canSyncRemoteState(false, true, true, true), false);
  assert.equal(canSyncRemoteState(true, false, true, true), false);
  assert.equal(canSyncRemoteState(true, true, false, true), false);
  assert.equal(canSyncRemoteState(true, true, true, false), false);
  assert.equal(canSyncRemoteState(true, true, true, true), true);
});
