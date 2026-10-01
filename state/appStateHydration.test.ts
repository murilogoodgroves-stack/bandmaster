import test from 'node:test';
import assert from 'node:assert/strict';

import { canShowBandSetupPrompt } from './appStateHydration.ts';

test('does not open the onboarding wizard while remote state is still hydrating', () => {
  assert.equal(canShowBandSetupPrompt(0, true), false);
});

test('opens the onboarding wizard only after hydration finishes and the state is empty', () => {
  assert.equal(canShowBandSetupPrompt(0, false), true);
  assert.equal(canShowBandSetupPrompt(1, false), false);
});
