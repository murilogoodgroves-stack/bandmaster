
import { TaskStatus, EventType, TransactionType, ContactTier, ReleaseType, TaskPriority, RoyaltySource, SongStatus, ProjectType, Daw, ProductionProjectStatus, CampaignType, GigStatus } from '../types';
import type { Task, CalendarEvent, Transaction, Budget, PressContact, MerchItem, Release, Tour, Setlist, Collaborator, User, LockedDate, FundingApplication, Festival, BandGoal, MediaAsset, SaasSubscription, PublishedArticle, RoyaltyStatement, Song, ProductionProject, BandProfile, EmailCampaign, Promoter, LabelContact, RadioContact, ReportConfig, Gig, FanContact, Invoice, BandSettings, CashHolding, MemberTransaction, Venue, OpeningSlotOpportunity, SavedFundingOpportunity, SavedResidency } from '../types';

export const initialBandProfiles: BandProfile[] = [
    { id: 'b1', name: "LOVNIS", genre: "Indie Rock, Dream Pop, Shozegaze" },
];

export const initialUsers: User[] = [
    { id: 'u1', name: "Moe (Vocals)", systemRole: "Admin", primaryRole: "Vocals", secondaryRoles: ["Keys", "Songwriter"], avatar: "https://i.pravatar.cc/150?u=moe", email: "moe@lovnis.band" },
    { id: 'u2', name: "Jamie (Guitar)", systemRole: "Member", primaryRole: "Guitar", secondaryRoles: ["Songwriter", "Producer"], avatar: "https://i.pravatar.cc/150?u=jamie", email: "jamie@lovnis.band" },
    { id: 'u3', name: "Sam (Bass)", systemRole: "Member", primaryRole: "Bass", secondaryRoles: ["BG Vocals"], avatar: "https://i.pravatar.cc/150?u=sam", email: "sam@lovnis.band" },
    { id: 'u4', name: "Chris (Drums)", systemRole: "Manager", primaryRole: "Drums", secondaryRoles: [], avatar: "https://i.pravatar.cc/150?u=chris", email: "chris@lovnis.band" },
];

const bandMemberIds = initialUsers.map(u => u.id);
const defaultBandId = initialBandProfiles[0].id;

export const initialTasks: Task[] = [
  { id: 't1', projectId: 'p1', songId: 's_01', title: "Finalize mix for 'Starlight Echo'", assignedToId: 'u1', dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().substring(0,10), status: TaskStatus.InProgress, priority: TaskPriority.Critical, phase: "Mixing", bandId: defaultBandId, goalId: 'g3' },
  { id: 't2', projectId: 'p2', title: "Design new 'Nebula' T-shirt", assignedToId: 'u3', dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().substring(0,10), status: TaskStatus.ToDo, priority: TaskPriority.High, bandId: defaultBandId },
  { id: 't4', projectId: 'p3', title: "Update website with tour dates", assignedToId: 'u2', dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().substring(0,10), status: TaskStatus.Done, priority: TaskPriority.Medium, bandId: defaultBandId },
  { id: 't5', projectId: 'p2', title: "Get quotes for vinyl pressing", assignedToId: 'u3', dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().substring(0,10), status: TaskStatus.InProgress, priority: TaskPriority.Medium, bandId: defaultBandId, goalId: 'g1' },
  { id: 't6', projectId: 'p1', title: "Shoot music video concept", assignedToId: 'u1', dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().substring(0,10), status: TaskStatus.ToDo, priority: TaskPriority.Low, phase: "Pre-Production", bandId: defaultBandId, goalId: 'g4' },
  
  // Tasks from old Production Project Pipeline
  { id: 'ppt_1', projectId: 'p1', title: "Finalize album tracklist order", assignedToId: "u1", dueDate: "2024-08-15", status: TaskStatus.Done, priority: TaskPriority.High, phase: "Pre-Production", bandId: defaultBandId, goalId: 'g3' },
  { id: 'ppt_3', projectId: 'p1', title: "Book studio time for the album", assignedToId: "u4", dueDate: "2024-09-01", status: TaskStatus.ToDo, priority: TaskPriority.Critical, phase: "Pre-Production", bandId: defaultBandId, goalId: 'g3' },
  { id: 'rt_1', projectId: 'p1', songId: 's_01', title: "Track all drum parts for 'Starlight Echo'", assignedToId: "u4", dueDate: "2024-09-15", status: TaskStatus.Done, priority: TaskPriority.High, phase: "Recording", bandId: defaultBandId, goalId: 'g3' },
  { id: 'rt_2', projectId: 'p1', songId: 's_02', title: "Track all bass parts for 'Nebula'", assignedToId: "u3", dueDate: "2024-09-20", status: TaskStatus.ToDo, priority: TaskPriority.High, phase: "Recording", bandId: defaultBandId, goalId: 'g3' },
  { id: 'rt_4', projectId: 'p1', songId: 's_01', title: "Re-track lead vocals for 'Starlight Echo'", assignedToId: "u1", dueDate: "2024-09-30", status: TaskStatus.ToDo, priority: TaskPriority.High, phase: "Recording", bandId: defaultBandId, goalId: 'g3' },
  { id: 'mt_2', projectId: 'p1', title: "Band review of all mixes", assignedToId: "u4", dueDate: "2024-10-15", status: TaskStatus.ToDo, priority: TaskPriority.Medium, phase: "Mixing", bandId: defaultBandId, goalId: 'g3' },
];

export const initialEvents: CalendarEvent[] = [
    { id: 'e1', title: "Gig at The Starlight Lounge", date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), type: EventType.Gig, notes: "Load-in at 7pm. On stage at 9pm. 45-minute set.", attendeeIds: bandMemberIds, fee: 500, contactPerson: "booking@starlight.com", bandId: defaultBandId },
    { id: 'e2', title: "Rehearsal for Tour", date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), type: EventType.Rehearsal, notes: "Run through the full festival setlist.", attendeeIds: bandMemberIds, bandId: defaultBandId },
    { id: 'e3', title: "Studio Session - Vocals", date: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(), type: EventType.Studio, notes: "Record vocals for 'Solar Flare' and 'Gravity'.", attendeeIds: [bandMemberIds[0]], bandId: defaultBandId },
];

export const initialLockedDates: LockedDate[] = [
    { date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().substring(0,10), members: [initialUsers[2].name], reason: "Family wedding", bandId: defaultBandId }
]

export const initialTransactions: Transaction[] = [
    { id: 'tx1', description: "Payment from The Comet Club gig", amount: 500, type: TransactionType.Income, category: 'Gig', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().substring(0,10), bandId: defaultBandId },
    { id: 'tx2', description: "New guitar strings and picks", amount: 45.50, type: TransactionType.Expense, category: 'Gear', date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().substring(0,10), bandId: defaultBandId },
    { id: 'tx3', description: "Merch sales at show", amount: 250, type: TransactionType.Income, category: 'Merch', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().substring(0,10), bandId: defaultBandId },
    { id: 'tx4', description: "Gas for van", amount: 80.00, type: TransactionType.Expense, category: 'Travel', date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().substring(0,10), bandId: defaultBandId },
    { id: 'tx5', description: "Spotify monthly payout", amount: 120.75, type: TransactionType.Income, category: 'Streaming', date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().substring(0,10), bandId: defaultBandId },
];

export const initialBudgets: Budget[] = [
    { category: 'Gear', amount: 200, bandId: defaultBandId },
    { category: 'Studio', amount: 500, bandId: defaultBandId },
    { category: 'Travel', amount: 300, bandId: defaultBandId },
    { category: 'Marketing', amount: 150, bandId: defaultBandId },
    { category: 'Other', amount: 100, bandId: defaultBandId },
];

export const initialPressContacts: PressContact[] = [
    { id: 'c1', name: "Jenna Riffs", outlet: "Indie Soundwaves Blog", email: "jenna@indiesoundwaves.com", tier: ContactTier.B, socials: "@indiesoundwaves", notes: "Loves dream pop, prefers short emails.", bandId: defaultBandId },
    { id: 'c2', name: "Marcus Tone", outlet: "Sonic Discovery Weekly", email: "marcus.t@sonicdiscovery.com", tier: ContactTier.A, socials: "@sonicdiscovery", notes: "Spotify playlist curator. Only pitch finished tracks.", bandId: defaultBandId },
];

export const initialLabelContacts: LabelContact[] = [];
export const initialRadioContacts: RadioContact[] = [];

export const initialFanContacts: FanContact[] = [
    { id: 'fan-1', name: 'Alice Fansworth', email: 'alice.fan@example.com', origin: 'Merch Table Signup', dateAdded: new Date().toISOString(), bandId: defaultBandId },
    { id: 'fan-2', name: 'Bob Listener', email: 'bob.listener@example.com', origin: 'Website Signup', dateAdded: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), bandId: defaultBandId },
];

export const initialPublishedArticles: PublishedArticle[] = [
    { id: 'pa1', releaseId: 'r1', title: "'Starlight Echo' is a shimmering piece of dream-pop genius", url: "#", outlet: "Indie Soundwaves Blog", author: "Jenna Riffs", publishDate: "2024-06-15", bandId: defaultBandId },
    { id: 'pa2', releaseId: 'r1', title: "LOVNIS reach for the stars on their latest single", url: "#", outlet: "Sonic Discovery Weekly", author: "Marcus Tone", publishDate: "2024-06-16", bandId: defaultBandId },
];

export const initialMerch: MerchItem[] = [
    { 
        id: 'm1', 
        name: "LOVNIS Logo T-Shirt", 
        type: "T-Shirt", 
        cost: 8.00,
        price: 25.00,
        variants: {
            "Size": [
                { id: 'v1s', name: 'S', stock: 15 },
                { id: 'v1m', name: 'M', stock: 25 },
                { id: 'v1l', name: 'L', stock: 20 },
                { id: 'v1xl', name: 'XL', stock: 8 },
            ]
        },
        bandId: defaultBandId
    },
    { 
        id: 'm2', 
        name: "'The Great Beyond' Vinyl", 
        type: "Vinyl", 
        cost: 15.50,
        price: 35.00,
        variants: {
            "Color": [
                { id: 'v2b', name: 'Black', stock: 30 },
                { id: 'v2s', name: 'Stardust Splatter (Ltd.)', stock: 8 },
            ]
        },
        bandId: defaultBandId
    },
];

export const initialReleases: Release[] = [
    {
        id: 'r1',
        title: "Starlight Echo",
        artist: "LOVNIS",
        type: ReleaseType.Single,
        releaseDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().substring(0,10),
        trackCount: 1,
        leadSingle: "Starlight Echo",
        coverArtUrl: "starlight-echo-cover.jpg",
        audioFiles: [{ name: "starlight-echo-master.wav", url: "#" }],
        musicUrl: 'https://open.spotify.com/embed/track/3fn8mKEco2e5k5sc1sQ5aC',
        checklist: [
            { id: 'r1t1', phase: 'Phase 1: Pre-Production', category: 'Audio & Design', text: 'All tracks mixed and mastered', deadlineOffsetDays: -42, priority: TaskPriority.Critical, completed: true, assignedToId: 'u1', isNA: false },
            { id: 'r1t2', phase: 'Phase 1: Pre-Production', category: 'Audio & Design', text: 'Album artwork designed and finalized', deadlineOffsetDays: -35, priority: TaskPriority.Critical, completed: true, assignedToId: 'u3', isNA: false },
            { id: 'r1t3', phase: 'Phase 2: Distribution Setup', category: 'Distributor Submission', text: 'Album submitted to digital distributor', deadlineOffsetDays: -28, priority: TaskPriority.Critical, completed: true, assignedToId: 'u4', isNA: false },
            { id: 'r1t4', phase: 'Phase 4: Promotional Strategy', category: 'Playlist Pitching', text: 'Spotify editorial pitch submitted', deadlineOffsetDays: -21, priority: TaskPriority.High, completed: false, assignedToId: 'u4', isNA: false },
            { id: 'r1t5', phase: 'Phase 7: Release Day Checklist', category: 'Social Media Blitz', text: 'Instagram feed post published', deadlineOffsetDays: 0, priority: TaskPriority.Critical, completed: false, assignedToId: null, isNA: false },
        ],
        bandId: defaultBandId
    }
];

export const initialSetlists: Setlist[] = [
    { id: 'sl1', name: "Standard 45-min Set", songs: ["Solar Flare", "Gravity", "Echoes", "Starlight", "Nebula", "The Great Beyond"], bandId: defaultBandId },
    { id: 'sl2', name: "Acoustic Set", songs: ["Echoes (Acoustic)", "Starlight (Acoustic)", "New Song Idea 1", "Gravity (Acoustic)"], bandId: defaultBandId },
];

export const initialTours: Tour[] = [
    {
        id: 'tour1',
        name: "Midwest Mini-Tour",
        startDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString().substring(0,10),
        endDate: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000).toISOString().substring(0,10),
        shows: [
            { id: 's1', date: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString().substring(0,10), city: "Chicago, IL", venue: "The Empty Bottle", setlistId: 'sl1', pay: { type: 'guarantee', amount: 400 }, status: 'Confirmed', schedule: [] },
            { id: 's2', date: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000).toISOString().substring(0,10), city: "Milwaukee, WI", venue: "The Cactus Club", setlistId: 'sl1', pay: { type: 'split', amount: 80 }, status: 'Confirmed', schedule: [] },
            { id: 's3', date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().substring(0,10), city: "Madison, WI", venue: "High Noon Saloon", setlistId: 'sl1', pay: { type: 'guarantee', amount: 350 }, status: 'Confirmed', schedule: [] },
        ],
        bandId: defaultBandId
    }
];

export const initialCollaborators: Collaborator[] = [
    { id: 'col1', name: "Lena Marks", role: "Producer", email: "lena@studiovibes.com", notes: "Produced our last EP. Great to work with.", bandId: defaultBandId },
    { id: 'col2', name: "Kevin Chu", role: "Photographer", email: "kevin@chu-tography.com", notes: "Did our latest promo shots.", bandId: defaultBandId },
];

export const initialGigs: Gig[] = [
    {
        id: 'gig1',
        clientName: 'Sarah Johnson',
        eventName: 'Wedding Reception',
        date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().substring(0,10),
        location: 'The Grand Ballroom, Anytown',
        status: 'Confirmed',
        fee: 3500,
        roles: [
            { id: 'gr1-1', roleName: 'Vocals', fee: 500, status: 'Confirmed', assignedMemberId: 'u1' },
            { id: 'gr1-2', roleName: 'Guitar', fee: 500, status: 'Confirmed', assignedMemberId: 'u2' },
            { id: 'gr1-3', roleName: 'Bass', fee: 500, status: 'Confirmed', assignedMemberId: 'u3' },
            { id: 'gr1-4', roleName: 'Drums', fee: 500, status: 'Confirmed', assignedMemberId: 'u4' },
            { id: 'gr1-5', roleName: 'Sound Tech', fee: 300, status: 'Open' },
        ],
        notes: 'Client requested a two-hour set with a short break. Emphasize classic rock covers.',
        bandId: defaultBandId,
    },
    {
        id: 'gig2',
        clientName: 'TechCorp Inc.',
        eventName: 'Annual Holiday Party',
        date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().substring(0,10),
        location: 'TechCorp HQ Rooftop',
        status: 'Offered',
        fee: 5000,
        roles: [
            { id: 'gr2-1', roleName: 'Vocals', fee: 700, status: 'Open' },
            { id: 'gr2-2', roleName: 'Guitar', fee: 700, status: 'Open' },
            { id: 'gr2-3', roleName: 'Bass', fee: 700, status: 'Open' },
            { id: 'gr2-4', roleName: 'Drums', fee: 700, status: 'Open' },
        ],
        contractUrl: '#',
        bandId: defaultBandId,
    },
    {
        id: 'gig3',
        clientName: 'Mark Chen',
        eventName: 'Inquiry for Birthday Party',
        date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().substring(0,10),
        location: 'Private Residence',
        status: 'Lead',
        fee: 2000,
        roles: [],
        bandId: defaultBandId,
    }
];

export const initialVenues: Venue[] = [];
export const initialOpeningSlots: OpeningSlotOpportunity[] = [];
export const initialSavedFundingOpps: SavedFundingOpportunity[] = [];
export const initialSavedResidencies: SavedResidency[] = [];

// NEW PRODUCTION DATA
export const initialSongs: Song[] = [
    {
        id: 's_01',
        title: "Starlight Echo",
        workingTitles: ["Stardust", "Echoes in the Void"],
        composerSplits: [{ id: 'cs1', composer: "Moe (Vocals)", percentage: 50 }, { id: 'cs2', composer: "Jamie (Guitar)", percentage: 50 }],
        dateCreated: "2024-05-10",
        genre: ["Dream Pop", "Indie Rock"],
        tempo: 125,
        keySignature: "A Major",
        status: SongStatus.Mixing,
        comments: "The bridge vocal needs one more pass. Also, let's try a different synth pad in the chorus.",
        projectId: 'p1',
        instrumentTracking: [
            { id: 'i1', name: 'Drums', progress: 100, status: 'Complete' },
            { id: 'i2', name: 'Bass', progress: 100, status: 'Complete' },
            { id: 'i3', name: 'Rhythm Guitar', progress: 100, status: 'Complete' },
            { id: 'i4', name: 'Lead Guitar', progress: 100, status: 'Complete' },
            { id: 'i5', name: 'Synths', progress: 100, status: 'Complete' },
            { id: 'i6', name: 'Lead Vocals', progress: 90, status: 'Needs Retake', notes: "Bridge vocal needs one more pass" },
            { id: 'i7', name: 'BG Vocals', progress: 100, status: 'Complete' },
        ],
        daw: Daw.Logic,
        sessionPath: "/Music/LOVNIS/Album1/StarlightEcho.logicx",
        bandId: defaultBandId,
    },
    {
        id: 's_02',
        title: "Nebula",
        workingTitles: [],
        composerSplits: [],
        dateCreated: "2024-06-20",
        genre: ["Shoegaze"],
        tempo: 90,
        keySignature: "F# Minor",
        status: SongStatus.Recording,
        comments: "Needs a stronger hook. Current version feels a bit meandering.",
        projectId: 'p1',
        instrumentTracking: [
            { id: 'i1', name: 'Drums', progress: 100, status: 'Complete' },
            { id: 'i2', name: 'Bass', progress: 50, status: 'In Progress' },
            { id: 'i3', name: 'Fuzz Guitar', progress: 20, status: 'In Progress' },
            { id: 'i4', name: 'Lead Vocals', progress: 0, status: 'Not Started' },
        ],
        bandId: defaultBandId,
    },
    {
        id: 's_03',
        title: "Solar Flare",
        workingTitles: [],
        composerSplits: [],
        dateCreated: "2024-07-01",
        genre: ["Indie Rock"],
        tempo: 140,
        keySignature: "E Major",
        status: SongStatus.Writing,
        comments: "Just a basic demo so far. High energy, could be a great opener.",
        projectId: 'p1',
        instrumentTracking: [],
        bandId: defaultBandId,
    },
];

export const songChecklistTemplate: Array<Omit<Task, 'id' | 'bandId' | 'projectId' | 'songId' | 'dueDate'>> = [
    { title: "Finalize Lyrics & Chords", assignedToId: "u1", status: TaskStatus.ToDo, priority: TaskPriority.High, phase: "Writing" },
    { title: "Record Demo", assignedToId: "u2", status: TaskStatus.ToDo, priority: TaskPriority.Medium, phase: "Pre-Production" },
    { title: "Track Drums & Bass", assignedToId: "u4", status: TaskStatus.ToDo, priority: TaskPriority.High, phase: "Recording" },
    { title: "Track Guitars & Keys", assignedToId: "u2", status: TaskStatus.ToDo, priority: TaskPriority.High, phase: "Recording" },
    { title: "Track Lead Vocals", assignedToId: "u1", status: TaskStatus.ToDo, priority: TaskPriority.Critical, phase: "Recording" },
    { title: "Track Backing Vocals", assignedToId: "u3", status: TaskStatus.ToDo, priority: TaskPriority.Medium, phase: "Recording" },
    { title: "Editing & Comping", assignedToId: "u2", status: TaskStatus.ToDo, priority: TaskPriority.Medium, phase: "Mixing" },
    { title: "Send for Mixing", assignedToId: "u4", status: TaskStatus.ToDo, priority: TaskPriority.High, phase: "Mixing" },
    { title: "Review Mix", assignedToId: "u1", status: TaskStatus.ToDo, priority: TaskPriority.Critical, phase: "Mixing" },
    { title: "Send for Mastering", assignedToId: "u4", status: TaskStatus.ToDo, priority: TaskPriority.High, phase: "Mastering" },
    { title: "Final Master Approved", assignedToId: "u1", status: TaskStatus.ToDo, priority: TaskPriority.Critical, phase: "Mastering" },
];

export const initialProductionProjects: ProductionProject[] = [
    {
        id: 'p1',
        name: "The Great Beyond (Album)",
        type: ProjectType.Album,
        status: ProductionProjectStatus.Recording,
        targetReleaseDate: "2025-03-01",
        songIds: ['s_01', 's_02', 's_03'],
        description: "Our debut full-length album. A journey through spacey soundscapes and introspective lyrics.",
        teamMemberIds: ['u1', 'u2', 'u3', 'u4'],
        bandId: defaultBandId,
    },
    {
        id: 'p2',
        name: "Merchandise Spring Collection",
        type: ProjectType.Other,
        status: ProductionProjectStatus.Planning,
        targetReleaseDate: "2025-02-01",
        songIds: [],
        description: "Designing and ordering new T-shirts and Vinyl for the upcoming tour.",
        teamMemberIds: ['u3', 'u4'],
        bandId: defaultBandId,
    },
    {
        id: 'p3',
        name: "General Admin",
        type: ProjectType.Other,
        status: ProductionProjectStatus.OnHold,
        targetReleaseDate: "",
        songIds: [],
        description: "Ongoing administrative tasks for the band.",
        teamMemberIds: ['u4'],
        bandId: defaultBandId,
    },
    {
        id: 'p-general',
        name: "General Tasks",
        type: ProjectType.Other,
        status: ProductionProjectStatus.OnHold,
        targetReleaseDate: "",
        songIds: [],
        description: "A general bucket for tasks that don't fit into a specific project.",
        teamMemberIds: [],
        bandId: defaultBandId,
    }
];

export const initialFundingApplications: FundingApplication[] = [
  { id: 'fa1', name: "Initiative Musik - Artist Grant", country: "Germany", openingDate: "2024-03-01", deadline: "2024-04-15", url: "#", projectSketch: "Funding for our debut album production and marketing campaign.", uploadedDocuments: [{name: 'Project_Budget.pdf', url:'#'}], status: 'Submitted', bandId: defaultBandId },
];

export const initialFestivals: Festival[] = [
  { id: 'f1', name: "Reeperbahn Festival", country: "Germany", submissionOpenDate: "2024-02-01", submissionDeadline: "2024-07-20", url: "#", bandId: defaultBandId },
];

export const initialGoals: BandGoal[] = [
  { id: 'g1', description: "Get our new single 'Starlight Echo' on a major Spotify editorial playlist.", targetDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().substring(0,10), achieved: false, bandId: defaultBandId },
  { id: 'g2', description: "Sell out our headline show at The Starlight Lounge.", targetDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().substring(0,10), achieved: false, bandId: defaultBandId },
  { id: 'g3', description: "Finish recording the full EP.", targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().substring(0,10), achieved: false, bandId: defaultBandId },
  { id: 'g4', description: "Release our first music video", targetDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().substring(0,10), achieved: true, achievedDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().substring(0,10), bandId: defaultBandId },
];

export const initialMediaAssets: MediaAsset[] = [
  { id: 'ma1', name: "Promo Photoshoot - Downtown", type: 'Photo', location: 'Google Drive', folderPath: '/Band Photos/2024/Promo_Downtown/', tags: ['promo', '2024', 'urban'], bandId: defaultBandId },
  { id: 'ma2', name: "'Starlight Echo' Music Video (Final)", type: 'Video', location: 'Main Hard Drive', folderPath: '/Videos/Starlight_Echo/Final_Cut/', tags: ['music video', 'official', 'starlight echo'], videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", bandId: defaultBandId },
];

export const initialSaasSubscriptions: SaasSubscription[] = [
  { id: 'ss1', name: "DistroKid", renewalDate: "2025-01-15", cost: 22.99, bandId: defaultBandId },
  { id: 'ss2', name: "Bandzoogle", renewalDate: "2024-12-01", cost: 199.00, bandId: defaultBandId },
];

export const initialRoyalties: RoyaltyStatement[] = [
    { id: 'rs1', source: RoyaltySource.GEMA, statementDate: "2024-04-15", period: "Q1 2024", amount: 245.80, bandId: defaultBandId },
    { id: 'rs2', source: RoyaltySource.DistroKid, statementDate: "2024-05-01", period: "April 2024", amount: 89.50, bandId: defaultBandId },
];

export const initialCampaigns: EmailCampaign[] = [
    {
        id: 'camp-init-1',
        name: "New Single Announce (Draft)",
        type: CampaignType.PressPromotion,
        subject: "For Immediate Release: LOVNIS Announce New Single 'Starlight Echo'",
        body: "",
        status: 'Draft',
        recipientIds: [],
        bandId: defaultBandId,
    }
];

export const initialPromoters: Promoter[] = [];

export const initialReports: ReportConfig[] = [];

export const initialInvoices: Invoice[] = [];

export const initialBandSettings: BandSettings = {
    issuerName: 'LOVNIS',
    issuerAddress: 'Musterstraße 1, 10115 Berlin, Germany',
    issuerTaxId: 'DE123456789', // Steuernummer or USt-IdNr.
    issuerBankDetails: 'IBAN: DE89 3704 0044 0532 0130 00\nBIC: COBADEFFXXX\nBank: Commerzbank'
};

export const initialCashHoldings: CashHolding[] = [
    { id: 'ch1', memberId: 'safe', amount: 500, bandId: defaultBandId }
];
export const initialMemberTransactions: MemberTransaction[] = [];


// DEPRECATED, DO NOT USE
// export const initialBandProfile: BandProfile = {
//     id: 'b1', name: "LOVNIS", genre: "Indie Rock, Dream Pop, Shozegaze"
// };
