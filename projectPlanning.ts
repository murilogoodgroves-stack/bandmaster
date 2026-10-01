import { ProjectType, TaskPriority, TaskStatus, type ProductionProject, type ProjectMilestone, type ProjectDeliverable, type Task } from './types';

const addDays = (baseDate: string, offsetDays: number) => {
  const date = new Date(baseDate || new Date().toISOString());
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
};

const differenceInDays = (targetDate: string) => {
  const releaseDate = targetDate ? new Date(targetDate) : new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  releaseDate.setHours(0, 0, 0, 0);
  return Math.ceil((releaseDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const getRecommendedLeadDays = (projectType: ProjectType) => {
  switch (projectType) {
    case ProjectType.Album:
      return 84;
    case ProjectType.EP:
      return 56;
    case ProjectType.MusicVideo:
      return 42;
    case ProjectType.Mixtape:
      return 49;
    default:
      return 42;
  }
};

const getReleaseRecommendationText = (projectType: ProjectType, date: string) => {
  const base = `For a ${projectType.toLowerCase()} release, the ideal launch date is ${date}.`;
  if (projectType === ProjectType.Album) {
    return `${base} Plan for an 8-12 week build with distributor timing, press outreach, and a 4-6 week promo arc before launch.`;
  }
  if (projectType === ProjectType.MusicVideo) {
    return `${base} Build a 6-week plan around storyboard approval, final edit, YouTube premiere, paid discovery, and audience retention after launch.`;
  }
  if (projectType === ProjectType.Single) {
    return `${base} Use a 4-6 week run with cover art, ISRC, smart links, pre-save, playlist pitching, and short-form video content. `;
  }
  return `${base} Keep the creative brief tight, align deliverables to a 5-7 week build, and prioritize single-focused promotion.`;
};

const getTypeSpecificChecklist = (projectType: ProjectType) => {
  if (projectType === ProjectType.Album) {
    return [
      'Finalize tracklist, metadata, artwork, and UPC/ISRC setup.',
      'Lock the distributor submission and pre-save/landing page build.',
      'Build a 4-6 week promo calendar with teaser clips, press, and email pushes.',
      'Pitch to editorial playlists, blogs, and radio + verify all links and release assets.',
      'Execute the launch weekend and monitor streams, saves, and engagement.',
      'Keep post-release momentum with live content, fan emails, and merch or physical follow-up.'
    ];
  }

  if (projectType === ProjectType.MusicVideo) {
    return [
      'Complete creative brief, storyboard, location plan, and rights check.',
      'Lock edit, color grade, captions, thumbnail, and YouTube metadata.',
      'Confirm premiere timing, paid discovery window, and teaser clips across socials.',
      'Coordinate a release-day community push with fan groups and collaborators.',
      'Track completion rates, click-throughs, and comments for the first 7-14 days.'
    ];
  }

  if (ProjectType.EP === projectType) {
    return [
      'Finalize the EP sequence and artwork package for all tracks.',
      'Prepare a 5-week rollout with a strong first single or standout track.',
      'Submit the EP to DSPs, pitch to curators, and prepare social content.',
      'Build direct-to-fan assets and update website/newsletter before release day.',
      'Review performance and convert momentum into follow-up content or shows.'
    ];
  }

  if (ProjectType.Mixtape === projectType) {
    return [
      'Define the project arc, sequencing, and release story for the tape.',
      'Prepare delivery assets, release date, and smart-link funnel.',
      'Rotate teasers and snippets to keep momentum without oversaturating listeners.',
      'Build a community push and follow-up content plan for the first two weeks.'
    ];
  }

  return [
    'Finalize mix and master, cover art, and ISRC metadata.',
    'Create a pre-save link and artist landing page before release day.',
    'Prepare short-form video social assets and direct-to-fan outreach.',
    'Submit the track to playlist and press targets; confirm link health before launch.',
    'Execute the release-day push and review engagement in the first 72 hours.'
  ];
};

export const evaluateProjectRisk = (targetReleaseDate: string, projectType: ProjectType) => {
  const safeLeadDays = getRecommendedLeadDays(projectType);
  const daysRemaining = differenceInDays(targetReleaseDate);

  if (!targetReleaseDate) {
    return {
      status: 'WARNING: No release date selected',
      mitigation: 'Add a release date to activate the safe launch timeline and assign a realistic launch buffer.',
      safeAlternativeDate: addDays(new Date().toISOString().slice(0, 10), safeLeadDays),
    };
  }

  if (daysRemaining < 0) {
    return {
      status: 'CRITICAL: Unsafe launch date',
      mitigation: 'The target date is already past. Use an expedited safe alternative date and re-prioritize publishing, approvals, and delivery tasks.',
      safeAlternativeDate: addDays(new Date().toISOString().slice(0, 10), safeLeadDays),
    };
  }

  if (daysRemaining < safeLeadDays) {
    return {
      status: 'WARNING: Tight lead time',
      mitigation: `The selected date violates the recommended lead-time for ${projectType}. An Expedited Safe Alternative Date is recommended: ${addDays(targetReleaseDate, safeLeadDays - daysRemaining)}.`,
      safeAlternativeDate: addDays(targetReleaseDate, safeLeadDays - daysRemaining),
    };
  }

  return {
    status: 'PASSED: Safe launch window',
    mitigation: 'The release timing remains within a safe window and can proceed with standard pre-flight checks.',
    safeAlternativeDate: targetReleaseDate,
  };
};

export const buildProjectExecutionPlan = (project: Pick<ProductionProject, 'id' | 'name' | 'type' | 'targetReleaseDate' | 'strategicGoal' | 'whatMoreCanIDo' | 'description'>) => {
  const releaseDate = project.targetReleaseDate || addDays(new Date().toISOString().slice(0, 10), 60);
  const risk = evaluateProjectRisk(releaseDate, project.type);
  const goalText = project.strategicGoal?.trim() || project.description?.trim() || 'Grow audience momentum and deliver a polished release.';
  const researchNeed = (project.whatMoreCanIDo || '').trim();
  const safeReleaseDate = risk.safeAlternativeDate || releaseDate;
  const recommendedReleaseDate = safeReleaseDate;
  const typeChecklist = getTypeSpecificChecklist(project.type);
  const tasks: Array<Pick<Task, 'title' | 'dueDate' | 'priority' | 'status' | 'notes'>> = [
    {
      title: `${project.name || 'Project'} safety & release timing audit`,
      dueDate: addDays(recommendedReleaseDate, -28),
      priority: TaskPriority.Critical,
      status: TaskStatus.ToDo,
      notes: `Safety review: ${risk.status}. Recommended lead time for ${project.type}: ${getRecommendedLeadDays(project.type)} days. ${risk.mitigation}`,
    },
    {
      title: `Set the release strategy and ideal launch date for ${project.type}`,
      dueDate: addDays(recommendedReleaseDate, -35),
      priority: TaskPriority.High,
      status: TaskStatus.ToDo,
      notes: `The ideal release window is ${recommendedReleaseDate}. Use a Friday launch, align artwork, distribution, and content to be ready ${getRecommendedLeadDays(project.type)} days before release, and keep a 72-hour post-launch review block.`,
    },
    {
      title: `Clarify strategy: ${goalText.slice(0, 90)}`,
      dueDate: addDays(recommendedReleaseDate, -28),
      priority: TaskPriority.High,
      status: TaskStatus.ToDo,
      notes: `Use the strategic goal to define audience, offer, proof points, and campaign priorities. Keep the channel mix focused on the most relevant platforms for ${project.type}.`,
    },
    {
      title: typeChecklist[0],
      dueDate: addDays(recommendedReleaseDate, -21),
      priority: TaskPriority.Critical,
      status: TaskStatus.ToDo,
      notes: 'Finalize all technical and creative assets before promotion begins so the public-facing campaign has no weak points.',
    },
    {
      title: typeChecklist[1],
      dueDate: addDays(recommendedReleaseDate, -16),
      priority: TaskPriority.High,
      status: TaskStatus.ToDo,
      notes: 'Build the distribution and asset infrastructure early enough to catch approval delays, missing metadata, or broken links.',
    },
    {
      title: typeChecklist[2],
      dueDate: addDays(recommendedReleaseDate, -12),
      priority: TaskPriority.High,
      status: TaskStatus.ToDo,
      notes: 'Prepare launch clips, teaser content, email hooks, and social scripts that match the audience and release strategy.',
    },
    {
      title: typeChecklist[3],
      dueDate: addDays(recommendedReleaseDate, -7),
      priority: TaskPriority.High,
      status: TaskStatus.ToDo,
      notes: 'Pitch editors, playlist curators, and collaborators with precise messaging. Confirm all links, calendar entries, and team responsibilities before launch week.',
    },
    {
      title: typeChecklist[4],
      dueDate: addDays(recommendedReleaseDate, 0),
      priority: TaskPriority.Critical,
      status: TaskStatus.ToDo,
      notes: 'On release day, push the final assets, confirm all channels are live, and monitor first-day engagement to catch issues quickly.',
    },
    {
      title: typeChecklist[5],
      dueDate: addDays(recommendedReleaseDate, 3),
      priority: TaskPriority.Medium,
      status: TaskStatus.ToDo,
      notes: 'Use the first 72 hours to review momentum, engage fans, and decide on the next content or live follow-up step.',
    },
    {
      title: 'Launch performance review and optimization',
      dueDate: addDays(recommendedReleaseDate, 7),
      priority: TaskPriority.Medium,
      status: TaskStatus.ToDo,
      notes: 'Check saves, shares, conversion paths, and conversion rates. Turn the strongest trailer or call-to-action into a second wave of promotion.',
    },
  ];

  if (researchNeed) {
    tasks.push({
      title: 'Research request: what more can I do?',
      dueDate: addDays(recommendedReleaseDate, -14),
      priority: TaskPriority.Medium,
      status: TaskStatus.ToDo,
      notes: `User note: "${researchNeed}". Pull only relevant and current information. Turn it into a refined audience insight, outreach list, or campaign action instead of generic market filler.`,
    });
  }

  return {
    riskStatus: risk.status,
    mitigation: risk.mitigation,
    safeAlternativeDate: risk.safeAlternativeDate,
    recommendedReleaseDate,
    releaseRecommendation: getReleaseRecommendationText(project.type, recommendedReleaseDate),
    tasks,
    notes: `Strategic goal: ${goalText}${researchNeed ? ` | Additional research request: ${researchNeed}` : ''}`,
  };
};

export const createDefaultProjectPlan = (
  projectName: string,
  projectType: ProjectType,
  targetReleaseDate: string
): Pick<ProductionProject, 'milestones' | 'deliverables'> => {
  const release = targetReleaseDate || addDays(new Date().toISOString().slice(0, 10), 60);

  const milestoneTemplates: Array<Omit<ProjectMilestone, 'id' | 'status' | 'dependencies' | 'deliverables'>> = [
    { title: 'Concept & brief', dueDate: addDays(release, -45) },
    { title: 'Creative direction', dueDate: addDays(release, -30) },
    { title: 'Production / recording', dueDate: addDays(release, -20) },
    { title: 'Mix & master', dueDate: addDays(release, -10) },
    { title: 'Release prep', dueDate: addDays(release, -3) },
  ];

  const milestones: ProjectMilestone[] = milestoneTemplates.map((template, index) => ({
    id: `milestone-${projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'project'}-${index}`,
    title: template.title,
    dueDate: template.dueDate,
    status: index === 0 ? 'in-progress' : 'pending',
    dependencies: index === 0 ? [] : [milestoneTemplates[index - 1].title],
    deliverables: [
      `${template.title} checklist`,
      `${projectType} status update`,
    ],
  }));

  const deliverables: ProjectDeliverable[] = [
    { id: `deliverable-${projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-art`, title: 'Artwork / visual assets', ownerId: '', dueDate: addDays(release, -12), status: 'pending' },
    { id: `deliverable-${projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-promo`, title: 'Promo materials', ownerId: '', dueDate: addDays(release, -7), status: 'pending' },
    { id: `deliverable-${projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-launch`, title: 'Launch plan', ownerId: '', dueDate: release, status: 'pending' },
  ];

  return { milestones, deliverables };
};

export const calculateProjectProgress = (project: Pick<ProductionProject, 'milestones' | 'deliverables'>) => {
  const milestones = project.milestones ?? [];
  const deliverables = project.deliverables ?? [];
  const totalSteps = milestones.length + deliverables.length;

  if (totalSteps === 0) {
    return 0;
  }

  const completed =
    milestones.filter((milestone) => milestone.status === 'done').length +
    deliverables.filter((deliverable) => deliverable.status === 'done').length;

  return Math.round((completed / totalSteps) * 100);
};

export const summarizeProjectPlanning = (project: Pick<ProductionProject, 'milestones' | 'deliverables'>) => {
  const milestones = project.milestones ?? [];
  const deliverables = project.deliverables ?? [];
  const activeMilestone = milestones
    .filter((milestone) => milestone.status !== 'done')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

  const blockedMilestones = milestones.filter((milestone) => {
    if (milestone.dependencies.length === 0) {
      return false;
    }
    return milestone.dependencies.some((dependencyId) => {
      const dependency = milestones.find((item) => item.id === dependencyId || item.title === dependencyId);
      return !dependency || dependency.status !== 'done';
    });
  });

  return {
    totalMilestones: milestones.length,
    doneMilestones: milestones.filter((milestone) => milestone.status === 'done').length,
    totalDeliverables: deliverables.length,
    doneDeliverables: deliverables.filter((deliverable) => deliverable.status === 'done').length,
    progress: calculateProjectProgress(project),
    nextMilestone: activeMilestone ?? null,
    blockedMilestones: blockedMilestones.map((milestone) => milestone.title),
  };
};
