import test from 'node:test';
import assert from 'node:assert/strict';

import { createDefaultProjectPlan, calculateProjectProgress, summarizeProjectPlanning, buildProjectExecutionPlan, evaluateProjectRisk } from './projectPlanning';
import { ProjectType, type ProductionProject } from './types';

test('default project plan includes milestones and deliverables', () => {
  const plan = createDefaultProjectPlan('New Album', ProjectType.Album, '2026-12-05');

  assert.ok(plan.milestones.length >= 3);
  assert.ok(plan.deliverables.length >= 3);
  assert.equal(plan.milestones[0].status, 'in-progress');
});

test('project planning summary calculates weighted progress correctly', () => {
  const project: ProductionProject = {
    id: 'project-1',
    name: 'New Album',
    type: ProjectType.Album,
    status: 'Planning',
    targetReleaseDate: '2026-12-05',
    songIds: [],
    bandId: 'band-1',
    milestones: [
      { id: 'm1', title: 'Brief', dueDate: '2026-10-30', status: 'done', dependencies: [], deliverables: ['brief'] },
      { id: 'm2', title: 'Production', dueDate: '2026-11-15', status: 'pending', dependencies: ['m1'], deliverables: ['tracks'] },
    ],
    deliverables: [
      { id: 'd1', title: 'Artwork', status: 'done', dueDate: '2026-11-01' },
      { id: 'd2', title: 'Press kit', status: 'pending', dueDate: '2026-11-25' },
    ],
  } as ProductionProject;

  assert.equal(calculateProjectProgress(project), 50);

  const summary = summarizeProjectPlanning(project);
  assert.equal(summary.doneMilestones, 1);
  assert.equal(summary.doneDeliverables, 1);
  assert.equal(summary.progress, 50);
  assert.equal(summary.nextMilestone?.title, 'Production');
});

test('blocked milestone detection accounts for dependency completion', () => {
  const project: ProductionProject = {
    id: 'project-2',
    name: 'EP',
    type: ProjectType.EP,
    status: 'Planning',
    targetReleaseDate: '2026-11-20',
    songIds: [],
    bandId: 'band-2',
    milestones: [
      { id: 'm1', title: 'Creative brief', dueDate: '2026-10-25', status: 'pending', dependencies: [], deliverables: ['brief'] },
      { id: 'm2', title: 'Tracking', dueDate: '2026-11-05', status: 'pending', dependencies: ['Creative brief'], deliverables: ['tracks'] },
    ],
    deliverables: [],
  } as ProductionProject;

  const summary = summarizeProjectPlanning(project);
  assert.deepEqual(summary.blockedMilestones, ['Tracking']);
});

test('project execution plan turns strategic goals into safe release tasks', () => {
  const project: ProductionProject = {
    id: 'project-3',
    name: 'New Single',
    type: ProjectType.Single,
    status: 'Planning',
    targetReleaseDate: '2026-12-10',
    description: 'Launch a strong single with press and playlist pushes.',
    strategicGoal: 'Build momentum around the track and reach new listeners.',
    whatMoreCanIDo: 'I need help finding similar artists, messaging, and a shortlist of press contacts.',
    songIds: [],
    bandId: 'band-3',
  } as ProductionProject;

  const plan = buildProjectExecutionPlan(project);

  assert.ok(plan.tasks.length >= 5);
  assert.ok(plan.tasks.some((task) => task.title.toLowerCase().includes('risk') || task.title.toLowerCase().includes('safety')));
  assert.ok(plan.tasks.some((task) => task.title.toLowerCase().includes('research') || task.title.toLowerCase().includes('press')));
  assert.ok(plan.tasks.some((task) => task.title.toLowerCase().includes('pre-save') || task.title.toLowerCase().includes('playlist') || task.title.toLowerCase().includes('smart link')));
  assert.equal(plan.riskStatus.includes('WARNING') || plan.riskStatus.includes('PASSED') || plan.riskStatus.includes('CRITICAL'), true);
  assert.ok(plan.tasks.some((task) => task.notes?.toLowerCase().includes('what more')) || plan.notes?.toLowerCase().includes('research'));
  assert.ok(plan.releaseRecommendation.toLowerCase().includes('single') || plan.releaseRecommendation.toLowerCase().includes('ideal'));
});

test('project risk evaluation flags unsafe launch windows', () => {
  const risk = evaluateProjectRisk('2026-10-05', ProjectType.Album);
  assert.match(risk.status, /CRITICAL|WARNING/);
  assert.ok(risk.mitigation.includes('Expedited Safe Alternative'));
});
