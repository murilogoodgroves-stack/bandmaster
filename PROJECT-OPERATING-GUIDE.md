# Bandmaster project operating guide

## Purpose of this document

This file serves as a reference for anyone or any AI continuing the project after a session, especially after content changes, onboarding changes, and environment setup work.

## Current project state

- The system has been cleaned to start without built-in demo data.
- The app does not load placeholder content by default.
- Band creation now goes through a guided wizard to collect real band data.
- The application core continues to work without depending on fake data.

## Safety rules for future changes

1. Never reintroduce demo content as the app default value.
2. Always keep the app starting in a clean or onboarding state.
3. Before changing initial data, create a new branch.
4. If sample data needs to be restored, do it explicitly and in isolation, not as default state.
5. Any significant change should be documented here.

## Active branch

The branch used for these adjustments was:

- cleanup-placeholder-content-wizard

If you continue development, use a new branch per feature.

Example:

```bash
git checkout -b feature-dashboard-ai
git checkout -b feature-band-setup
git checkout -b fix-calendar-loading
```

## How the wizard works

The wizard lives inside the band creation modal and now works like a real setup interview for the band. It collects:

- band name
- genre
- city
- country
- current band stage
- release status
- release title and date
- tour status
- upcoming shows list
- current focus
- bio and internal notes

These fields feed the band state without forcing placeholder content. At any time, the user can click "Skip for now" to continue blank and then complete the band later using the discreet icon next to the band name.

## What was cleaned

Default data was removed from:

- initial band data
- demo users
- demo tasks
- demo events
- demo transactions
- demo releases
- demo merch
- demo setlists
- demo gigs
- demo projects
- demo campaigns
- demo royalties
- demo media files

This prevents the application from being delivered with fake names, albums, and projects already in place.

## How to revert if something breaks

If a later change impacts functionality:

1. return to the main branch or the reference branch
2. confirm the latest stable commit
3. check the localStorage state and the wizard flow
4. remove duplicated semantic changes
5. revalidate with the project build

Useful command:

```bash
git checkout main
git log --oneline --decorate -n 10
```

## Recommended workflow going forward

- work in a feature branch
- validate the build whenever a large change is made
- keep real, band-specific data in the band creation flow
- avoid storing sample data as the default app state
- respect the onboarding flow and the "skip for now" option to avoid blocking the initial experience
- use the discreet edit icon to reopen the wizard and adjust the data without breaking the current state

## Key related files

- App.tsx
- data/initialData.ts
- types.ts

## Final note

The app should open in a clean state and require the user to configure the real band from the start. This reduces noise, avoids placeholders, and leaves the system more professional and ready for real-world use.
