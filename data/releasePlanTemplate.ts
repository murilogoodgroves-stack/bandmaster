import { TaskPriority } from '../types';
import type { ReleaseChecklistItem } from '../types';

type ChecklistTemplateItem = Omit<ReleaseChecklistItem, 'id' | 'completed' | 'assignedToId' | 'isNA' | 'fileUrl' | 'linkUrl' | 'notes'>;

// This is a representative subset of the user's requested 9-phase plan.
export const releasePlanTemplate: ChecklistTemplateItem[] = [
  // Phase 1: Pre-Production (6-8 weeks before release)
  {
    phase: 'Phase 1: Pre-Production',
    category: 'Technical Checklist',
    text: 'All tracks mixed and mastered',
    deadlineOffsetDays: -56, // 8 weeks
    priority: TaskPriority.Critical,
  },
  {
    phase: 'Phase 1: Pre-Production',
    category: 'Technical Checklist',
    text: 'Album artwork designed and finalized (3000x3000px)',
    deadlineOffsetDays: -49, // 7 weeks
    priority: TaskPriority.Critical,
  },
  {
    phase: 'Phase 1: Pre-Production',
    category: 'Assets & Branding',
    text: 'Complete new press images/hero image for the campaign',
    deadlineOffsetDays: -52,
    priority: TaskPriority.High,
  },
  {
    phase: 'Phase 1: Pre-Production',
    category: 'Assets & Branding',
    text: 'Update artist bio (short and long versions)',
    deadlineOffsetDays: -45,
    priority: TaskPriority.High,
  },
  {
    phase: 'Phase 1: Pre-Production',
    category: 'Assets & Branding',
    text: 'Create a shareable online drive (Dropbox/Google Drive) with final WAVs, MP3s, artwork, press photos, and bio',
    deadlineOffsetDays: -42,
    priority: TaskPriority.Medium,
  },
  {
    phase: 'Phase 1: Pre-Production',
    category: 'Legal & Rights Management',
    text: 'Confirm royalty splits with ALL collaborators and get agreements signed',
    deadlineOffsetDays: -60,
    priority: TaskPriority.Critical,
  },
   {
    phase: 'Phase 1: Pre-Production',
    category: 'Legal & Rights Management',
    text: 'Upload signed split sheets for each track',
    deadlineOffsetDays: -58,
    priority: TaskPriority.Critical,
  },
  {
    phase: 'Phase 1: Pre-Production',
    category: 'Legal & Rights Management',
    text: 'All songs registered with PRO (ASCAP, BMI, etc.) and SoundExchange',
    deadlineOffsetDays: -50,
    priority: TaskPriority.High,
  },

  // Phase 2: Distribution Setup
  {
    phase: 'Phase 2: Distribution Setup',
    category: 'Distributor Submission',
    text: 'Album submitted to digital distributor (e.g., GYROstream, DistroKid)',
    deadlineOffsetDays: -28, // 4 weeks
    priority: TaskPriority.Critical,
  },
  {
    phase: 'Phase 2: Distribution Setup',
    category: 'Distributor Submission',
    text: 'Generate Pre-save/pre-order campaign link via distributor/service',
    deadlineOffsetDays: -25,
    priority: TaskPriority.High,
  },
  {
    phase: 'Phase 2: Distribution Setup',
    category: 'Spotify Setup',
    text: 'Claim Spotify for Artists profile (if first release)',
    deadlineOffsetDays: -30,
    priority: TaskPriority.High,
  },
  {
    phase: 'Phase 2: Distribution Setup',
    category: 'Spotify Setup',
    text: 'Pitch lead single via Spotify for Artists pitching tool',
    deadlineOffsetDays: -21, // 3 weeks
    priority: TaskPriority.Critical,
  },
  {
    phase: 'Phase 2: Distribution Setup',
    category: 'Other Platforms',
    text: 'Pitch to Amazon Music for Artists editorial playlists',
    deadlineOffsetDays: -21,
    priority: TaskPriority.High,
  },
   {
    phase: 'Phase 2: Distribution Setup',
    category: 'Other Platforms',
    text: 'Perform a digital audit: update photos and bios on all DSPs and social channels',
    deadlineOffsetDays: -20,
    priority: TaskPriority.Medium,
  },
  
  // Phase 3: Visual Content Creation
  {
    phase: 'Phase 3: Visual Content Creation',
    category: 'Long-Form Video Content',
    text: 'Traditional music video filmed (for lead single)',
    deadlineOffsetDays: -42,
    priority: TaskPriority.High,
  },
  {
    phase: 'Phase 3: Visual Content Creation',
    category: 'Short-Form Content',
    text: 'Select 10-15s "golden snippet" from lead single for social media',
    deadlineOffsetDays: -35,
    priority: TaskPriority.High,
  },
  {
    phase: 'Phase 3: Visual Content Creation',
    category: 'Short-Form Content',
    text: 'Create and upload Spotify Canvas loops for all tracks (3-8 seconds)',
    deadlineOffsetDays: -10,
    priority: TaskPriority.Medium,
  },

  // Phase 4: Promotional Strategy
  {
    phase: 'Phase 4: Promotional Strategy',
    category: 'Social Media Content Calendar',
    text: 'Schedule album announcement post',
    deadlineOffsetDays: -28,
    priority: TaskPriority.High,
  },
   {
    phase: 'Phase 4: Promotional Strategy',
    category: 'Social Media Content Calendar',
    text: 'Set up YouTube premiere for music video',
    deadlineOffsetDays: -7,
    priority: TaskPriority.Medium,
  },
  {
    phase: 'Phase 4: Promotional Strategy',
    category: 'Playlist Pitching',
    text: 'Research and contact 50-100 independent playlist curators',
    deadlineOffsetDays: -21,
    priority: TaskPriority.High,
  },
  {
    phase: 'Phase 4: Promotional Strategy',
    category: 'Press & Media Outreach',
    text: 'Finalize press release and begin outreach to blogs/media',
    deadlineOffsetDays: -25,
    priority: TaskPriority.High,
  },
  
  // Phase 5: Pre-Release Campaign
  {
    phase: 'Phase 5: Pre-Release Campaign',
    category: 'Pre-Save/Pre-Order Campaign',
    text: 'Launch pre-save/pre-order campaign and share link across socials',
    deadlineOffsetDays: -14,
    priority: TaskPriority.Critical,
  },
  {
    phase: 'Phase 5: Pre-Release Campaign',
    category: 'Paid Advertising Setup',
    text: 'Set up and schedule Meta Ads (Facebook/Instagram) campaign',
    deadlineOffsetDays: -7,
    priority: TaskPriority.High,
  },

  // Phase 6: Final Week Before Release
  {
    phase: 'Phase 6: Final Week Before Release',
    category: 'Content Verification',
    text: 'Review and approve all scheduled social media posts',
    deadlineOffsetDays: -3,
    priority: TaskPriority.Critical,
  },
  {
    phase: 'Phase 6: Final Week Before Release',
    category: 'Platform Final Checks',
    text: 'Update Linktree/Smart Link with all platform links',
    deadlineOffsetDays: -1,
    priority: TaskPriority.Critical,
  },
   {
    phase: 'Phase 6: Final Week Before Release',
    category: 'Platform Final Checks',
    text: 'Update profile pictures to new press image across all platforms',
    deadlineOffsetDays: -2,
    priority: TaskPriority.Medium,
  },
  
  // Phase 7: Release Day
  {
    phase: 'Phase 7: Release Day',
    category: 'Morning Of Release',
    text: 'Verify music is live on all major platforms',
    deadlineOffsetDays: 0,
    priority: TaskPriority.Critical,
  },
  {
    phase: 'Phase 7: Release Day',
    category: 'Social Media Blitz',
    text: 'Publish release announcement on all social media channels (Instagram, TikTok, etc.)',
    deadlineOffsetDays: 0,
    priority: TaskPriority.Critical,
  },
    {
    phase: 'Phase 7: Release Day',
    category: 'Social Media Blitz',
    text: 'Update all social media bios with new smart link',
    deadlineOffsetDays: 0,
    priority: TaskPriority.Critical,
  },
  {
    phase: 'Phase 7: Release Day',
    category: 'Email & Newsletter',
    text: 'Send release day newsletter to mailing list',
    deadlineOffsetDays: 0,
    priority: TaskPriority.High,
  },
   {
    phase: 'Phase 7: Release Day',
    category: 'Lyrics & Data',
    text: 'Register lyrics on Musixmatch (for Instagram Stories)',
    deadlineOffsetDays: 0,
    priority: TaskPriority.Medium,
  },
  {
    phase: 'Phase 7: Release Day',
    category: 'Lyrics & Data',
    text: 'Register lyrics on Genius.com and add annotations',
    deadlineOffsetDays: 0,
    priority: TaskPriority.Medium,
  },
  
  // Phase 8: Post-Release
  {
    phase: 'Phase 8: Post-Release',
    category: 'Ongoing Promotion',
    text: 'Check S4A & Apple Music for Artists for playlist adds; share wins on social media',
    deadlineOffsetDays: 1,
    priority: TaskPriority.High,
  },
  {
    phase: 'Phase 8: Post-Release',
    category: 'Ongoing Promotion',
    text: 'Create an artist playlist on Spotify and add your new track',
    deadlineOffsetDays: 2,
    priority: TaskPriority.Medium,
  },
  {
    phase: 'Phase 8: Post-Release',
    category: 'Ongoing Promotion',
    text: 'Set your new release as the "Artist Pick" on Spotify',
    deadlineOffsetDays: 2,
    priority: TaskPriority.High,
  },
  {
    phase: 'Phase 8: Post-Release',
    category: 'Engagement',
    text: 'Follow up with press/media outlets that didn\'t respond pre-release',
    deadlineOffsetDays: 7,
    priority: TaskPriority.Medium,
  },
   {
    phase: 'Phase 8: Post-Release',
    category: 'Engagement',
    text: 'Celebrate release anniversaries (1 week, 1 month) on socials',
    deadlineOffsetDays: 7,
    priority: TaskPriority.Low,
  },
  
  // Phase 9: Long-Term Promotion
  {
    phase: 'Phase 9: Long-Term Promotion',
    category: 'Strategy',
    text: 'Consider a "waterfall" release strategy for subsequent singles from an EP/Album',
    deadlineOffsetDays: 30,
    priority: TaskPriority.Medium,
  },
  {
    phase: 'Phase 9: Long-Term Promotion',
    category: 'Strategy',
    text: 'Compile a "bragging sheet" with best wins (reviews, playlist adds, etc.) for future pitches',
    deadlineOffsetDays: 21,
    priority: TaskPriority.Low,
  },
  {
    phase: 'Phase 9: Long-Term Promotion',
    category: 'Data Analysis',
    text: 'Analyze Spotify for Artists listener demographics to inform future marketing/touring',
    deadlineOffsetDays: 30,
    priority: TaskPriority.Low,
  },
];