import test from 'node:test';
import assert from 'node:assert/strict';

import { generateReleaseLandingPage, buildNewsletterEmailHtml, buildMailchimpCampaignPayload, validateMailchimpConfig } from './releaseMarketing';

test('release landing page includes a classic press-ready layout and project details', () => {
  const html = generateReleaseLandingPage({
    id: 'p-1',
    name: 'Night Signal',
    type: 'Single' as any,
    status: 'Planning' as any,
    targetReleaseDate: '2026-11-01',
    description: 'A bold new single from the band.',
    strategicGoal: 'Turn new listeners into fans.',
    bandId: 'band-1'
  }, 'Velvet Echo', 'Classic editorial release page');

  assert.match(html, /Night Signal/i);
  assert.match(html, /Velvet Echo/i);
  assert.match(html, /Classic/i);
  assert.match(html, /album|single|press|stream/i);
});

test('newsletter HTML is email-safe and includes preheader and CTA', () => {
  const html = buildNewsletterEmailHtml({
    projectName: 'Night Signal',
    artistName: 'Velvet Echo',
    releaseDate: '2026-11-01',
    description: 'A new single out across all platforms.',
    ctaText: 'Listen now',
    ctaUrl: 'https://example.com/listen'
  });

  assert.match(html, /<html/i);
  assert.match(html, /Preheader/i);
  assert.match(html, /Listen now/i);
  assert.match(html, /table/i);
});

test('mailchimp payload builds with a safe strict structure', () => {
  const payload = buildMailchimpCampaignPayload({
    subject: 'Night Signal is out now',
    fromName: 'Velvet Echo',
    replyTo: 'hello@velvetecho.com',
    html: '<p>Hello</p>',
    listId: 'abc123',
    title: 'Night Signal release'
  });

  assert.equal(payload.type, 'regular');
  assert.equal(payload.recipients.list_id, 'abc123');
  assert.equal(payload.settings.subject_line, 'Night Signal is out now');
});

test('mailchimp config validation rejects missing values', () => {
  assert.equal(validateMailchimpConfig({ apiKey: '', serverPrefix: 'us1', listId: 'abc' }).valid, false);
  assert.equal(validateMailchimpConfig({ apiKey: 'x', serverPrefix: 'us1', listId: 'abc' }).valid, true);
});
