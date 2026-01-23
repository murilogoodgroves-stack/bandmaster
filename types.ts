
export type Page = 
  'dashboard' | 'projects' | 'calendar' | 'financials' | 
  'press' | 'merch' | 'releases' | 'tours' | 'setlists' | 
  'collaborators' | 'resources' | 'settings' | 'production' |
  'funding' | 'festivals' | 'goals' | 'media' | 'epk' |
  'royalties' | 'gigs' | 'campaigns' | 'label' | 'reports' | 'fanbase' |
  'stage' | 'radio' | 'social' | 'sound-match' | 'invoices' | 'residencies';

export enum TaskStatus {
  ToDo = 'To Do',
  InProgress = 'In Progress',
  Done = 'Done'
}

export enum TaskPriority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Critical = 'Critical'
}

export interface Task {
  id: string;
  title: string;
  assignedToId: string;
  dueDate: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
  songId?: string;
  goalId?: string;
  releaseId?: string;
  phase?: string;
  notes?: string;
  bandId: string;
}

export enum EventType {
  Rehearsal = 'Rehearsal',
  Gig = 'Gig',
  Studio = 'Studio Session',
  Meeting = 'Meeting',
  Interview = 'Interview',
  Deadline = 'Submission Deadline',
  TaskDeadline = 'Task Deadline',
  ReleaseDate = 'Release Date',
  TourDate = 'Tour Date',
  FundingDeadline = 'Funding Deadline',
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: EventType;
  notes: string;
  attendeeIds: string[];
  contactPerson?: string;
  riderUrl?: string;
  backlineInfo?: string;
  fee?: number;
  bandId: string;
}

export interface LockedDate {
  date: string; // YYYY-MM-DD
  members: string[]; // Array of user names
  reason?: string;
  bandId: string;
}

export enum TransactionType {
  Income = 'Income',
  Expense = 'Expense'
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  bandId: string;
  invoiceId?: string;
  gigId?: string;
}

export interface Budget {
    category: string;
    amount: number;
    bandId: string;
}

export enum ContactTier {
  A = 'A (High Priority)',
  B = 'B (Important)',
  C = 'C (Useful)'
}

export interface PressContact {
  id: string;
  name: string;
  outlet: string;
  email: string;
  tier: ContactTier;
  socials?: string;
  notes?: string;
  country?: string;
  city?: string;
  sourceUrl?: string;
  bandId: string;
}

export interface FoundPressContact {
    name: string;
    outlet: string;
    email: string;
    country: string;
    city: string;
    url: string;
}

export interface PublishedArticle {
  id: string;
  releaseId: string;
  title: string;
  url: string;
  outlet: string;
  author: string;
  publishDate: string;
  bandId: string;
}

export interface MerchVariant {
    id: string;
    name: string; // e.g., "Small", "Blue"
    stock: number;
}

export interface MerchItem {
    id:string;
    name: string;
    type: string; // T-Shirt, Vinyl, CD, Poster
    cost: number;
    price: number;
    variants: {
      [key: string]: MerchVariant[];
    };
    bandId: string;
}

export interface ShowMerchSale {
  showId: string;
  itemId: string;
  variantId: string;
  quantity: number;
  bandId: string;
}

export enum ReleaseType {
    Single = 'Single',
    EP = 'EP',
    Album = 'Album',
    MusicVideo = 'Music Video',
    Mixtape = 'Mixtape'
}

export interface ReleaseChecklistItem {
    id: string;
    phase: string;
    category: string;
    text: string;
    deadlineOffsetDays: number; // e.g., -28 for 4 weeks before release
    completed: boolean;
    assignedToId: string | null;
    priority: TaskPriority;
    notes?: string;
    isNA: boolean;
    linkedTaskId?: string;
    // For specific task types
    fileUrl?: string; // For uploads
    linkUrl?: string; // For smart links etc.
    isConditional?: boolean; // e.g., for cover song license
}

export interface Release {
    id: string;
    title: string;
    artist: string;
    type: ReleaseType;
    releaseDate: string;
    trackCount: number;
    leadSingle: string;
    coverArtUrl?: string;
    audioFiles: { name: string, url: string }[];
    checklist: ReleaseChecklistItem[];
    musicUrl?: string; // For EPK
    bandId: string;
    projectId?: string;
    budget?: number;
    strategySummary?: string;
}

export interface PaidCampaign {
    id: string;
    releaseId: string;
    platform: string; // e.g., Meta, TikTok, Google Ads
    budget: number;
    startDate: string;
    endDate: string;
    results: string; // Text field for impressions, clicks, etc.
    bandId: string;
}

export interface Show {
    id: string;
    date: string;
    city: string;
    venue: string;
    setlistId?: string;
    pay?: {
        type: 'guarantee' | 'split' | 'hybrid';
        amount: number;
    };
    status: 'Planning' | 'Confirmed' | 'Done';
    contactName?: string;
    contactInfo?: string; // email or phone
    accommodation?: string; // Hotel name, address, confirmation #
    notes?: string;
    schedule: { time: string; event: string }[]; // e.g., { time: '6:00 PM', event: 'Load In' }
}

export interface Tour {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    shows: Show[];
    budget?: number;
    notes?: string;
    bandId: string;
}

export interface Setlist {
    id: string;
    name: string;
    songs: string[];
    bandId: string;
}

export interface Collaborator {
    id: string;
    name: string;
    role: string;
    email: string;
    notes: string;
    bandId: string;
}

export interface WebSource {
  uri: string;
  title: string;
}

export interface SearchResult {
  answer: string;
  sources: WebSource[];
}

export interface User {
  id: string;
  name: string;
  systemRole: 'Admin' | 'Member' | 'Manager';
  primaryRole: string; // e.g., 'Vocals', 'Guitar'
  secondaryRoles: string[]; // e.g., ['Keys', 'Tech']
  avatar: string;
  email: string;
}

export interface BandProfile {
  id: string;
  name: string;
  genre: string;
}

export interface WizardChatMessage {
    id: string;
    sender: 'user' | 'wizard';
    text: string;
    sources?: WebSource[];
}

// PRODUCTION STUDIO TYPES

export enum SongStatus {
  Idea = 'Idea/Demo',
  Writing = 'Writing in Progress',
  WritingComplete = 'Writing Complete',
  PreProduction = 'Pre-Production',
  Recording = 'Recording in Progress',
  RecordingComplete = 'Recording Complete',
  Mixing = 'Mixing',
  Mastering = 'Mastering',
  ReadyForRelease = 'Ready for Release',
  Released = 'Released',
  Archived = 'Archived'
}

export enum Daw {
    Logic = 'Logic Pro',
    Ableton = 'Ableton Live',
    ProTools = 'Pro Tools',
    FLStudio = 'FL Studio',
    Other = 'Other'
}

export interface ComposerSplit {
    id: string;
    composer: string;
    percentage: number;
}

export interface InstrumentTracking {
    id: string;
    name: string;
    progress: number; // 0-100
    status: 'Not Started' | 'In Progress' | 'Needs Retake' | 'Complete';
    performer?: string;
    notes?: string;
}

export interface Song {
  id: string;
  title: string;
  workingTitles: string[];
  composerSplits: ComposerSplit[];
  dateCreated: string;
  genre: string[];
  tempo: number;
  keySignature: string;
  status: SongStatus;
  
  // Files & Assets
  demoUrl?: string;
  lyricsPath?: string;
  masterPath?: string;
  instrumentalPath?: string;
  stemsPath?: string;

  // Production
  daw?: Daw;
  sessionPath?: string;
  productionNotes?: string;
  mixingEngineer?: string;
  masteringEngineer?: string;
  comments?: string;

  // Recording Progress
  instrumentTracking: InstrumentTracking[];

  // Publishing & Rights
  isrc?: string;
  pro?: 'ASCAP' | 'BMI' | 'SESAC' | 'Other';

  // Release Info
  projectId?: string; // Link to a ProductionProject
  bandId: string;
}

export enum ProjectType {
    Album = 'Album',
    EP = 'EP',
    Single = 'Single',
    MusicVideo = 'Music Video',
    Mixtape = 'Mixtape',
    Other = "Other"
}

export enum ProductionProjectStatus {
    Planning = 'Planning',
    PreProduction = 'Pre-Production',
    Recording = 'Recording',
    Mixing = 'Mixing',
    Mastering = 'Mastering',
    Released = 'Released',
    OnHold = 'On Hold',
}

export interface ProductionProject {
    id: string;
    name: string;
    type: ProjectType;
    status: ProductionProjectStatus;
    targetReleaseDate: string;
    artworkUrl?: string;
    songIds: string[];
    description?: string;
    teamMemberIds?: string[]; // Links to User.id
    bandId: string;
}


export interface BandGoal {
  id: string;
  description: string;
  targetDate: string;
  achieved: boolean;
  achievedDate?: string;
  bandId: string;
}

export interface FundingApplication {
  id: string;
  name: string;
  country: string; // e.g., Germany
  openingDate: string;
  deadline: string;
  url: string;
  projectSketch: string;
  uploadedDocuments: { name: string, url: string }[];
  status: 'Researching' | 'Applying' | 'Submitted' | 'Rejected' | 'Approved';
  bandId: string;
}

export interface Festival {
  id: string;
  name: string;
  country: string;
  submissionOpenDate: string;
  submissionDeadline: string;
  url: string;
  bandId: string;
}

export interface SaasSubscription {
  id: string;
  name: string; // e.g., DistroKid, Google Drive
  renewalDate: string;
  cost: number;
  bandId: string;
}

export interface MediaAsset {
  id: string;
  name: string;
  type: 'Photo' | 'Video' | 'Link';
  location: string; // 'Google Drive', 'Main Hard Drive', etc.
  folderPath: string; // Path or URL
  tags: string[];
  videoUrl?: string;
  bandId: string;
}

export interface PressRelease {
  id: string;
  title: string;
  date: string;
  content: string;
}

export interface FundingOpportunity {
  name: string;
  description: string;
  url: string;
  deadline?: string;
}

export interface SavedFundingOpportunity extends FundingOpportunity {
  id: string;
  bandId: string;
}

export interface FestivalOpportunity {
  name: string;
  country: string;
  description: string;
  url: string;
  genre: string;
  deadline: string;
}

export interface FestivalDirectoryEntry {
  name: string;
  country: string;
  typicalMonth: number; // 1-12
  url: string;
  contactName: string;
  contactEmail: string;
}

export interface ResidencyOpportunity {
    name: string;
    location: string;
    description: string;
    url: string;
    email?: string;
    deadline?: string; // YYYY-MM-DD or "Ongoing"
    costType: 'Paid/Stipend' | 'Free' | 'Fee Required' | 'Unknown';
    discipline?: string;
}

export interface SavedResidency extends ResidencyOpportunity {
    id: string;
    bandId: string;
}

// Royalties Types
export enum RoyaltySource {
    GEMA = "GEMA",
    ASCAP = "ASCAP",
    BMI = "BMI",
    SESAC = "SESAC",
    SoundExchange = "SoundExchange",
    DistroKid = "DistroKid",
    TuneCore = "TuneCore",
    Other = "Other"
}

export interface RoyaltyStatement {
    id: string;
    source: RoyaltySource;
    statementDate: string;
    period: string; // e.g., "Q1 2024"
    amount: number;
    notes?: string;
    bandId: string;
}

// Gigs & Booking Types (Replaces old Booking types)
export type GigStatus = 'Lead' | 'Offered' | 'Confirmed' | 'Done' | 'Cancelled';

export interface GigRole {
    id: string;
    roleName: string; // 'Drums', 'Vocals', 'Sound Tech'
    fee: number;
    status: 'Open' | 'Offered' | 'Confirmed';
    assignedMemberId?: string; // Links to User.id
}

export interface Gig {
    id: string;
    clientName: string;
    eventName: string;
    date: string; // YYYY-MM-DD
    location: string;
    status: GigStatus;
    fee: number;
    roles: GigRole[];
    contractUrl?: string;
    invoiceUrl?: string;
    notes?: string;
    bandId: string;
    headlinerArtist?: string; // For opening slots
    promoterId?: string; // Link to Promoter
    sourceUrl?: string; // Where the lead was found
}


export interface Venue {
    id: string;
    name: string;
    city: string;
    description: string;
    capacity?: number;
    contactUrl: string;
    bookingEmail?: string;
    generalEmail?: string;
    notes?: string;
    bandId: string;
}

export interface OpeningSlotOpportunity {
    headlinerArtist: string;
    date: string;
    venue: string;
    city: string;
    promoterName: string;
    promoterEmail: string;
    sourceUrl: string;
}

export interface Promoter {
    id: string;
    name: string;
    email: string;
    source: string; // e.g., "From opening for The Killers"
    bandId: string;
}


// Email Campaign Types
export enum CampaignType {
    Newsletter = "Newsletter",
    PressPromotion = "Press Promotion",
    VenueOutreach = "Venue Outreach",
    TourAnnouncement = "Tour Announcement",
    LabelPitch = "Label Pitch",
    RadioOutreach = "Radio Outreach",
    General = "General"
}

export interface EmailFollowUp {
    delayDays: number;
    subject: string;
    body: string;
}

export interface EmailCampaign {
  id: string;
  name: string;
  type: CampaignType;
  subject: string;
  body: string;
  status: 'Draft' | 'Sent' | 'Scheduled';
  recipientIds: string[];
  sentDate?: string;
  scheduledDate?: string;
  projectId?: string;
  // Simulated stats
  openRate?: number;
  clickRate?: number;
  bandId: string;
  followUp?: EmailFollowUp;
  followUpSentDate?: string;
}

// Label Reachout Types
export interface LabelContact {
  id: string;
  name: string;
  labelName: string;
  email: string;
  country?: string;
  city?: string;
  genres?: string;
  submissionUrl?: string;
  notes?: string;
  socials?: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
    bandcamp?: string;
  };
  bandId: string;
}

export interface LabelOpportunity {
  labelName: string;
  contactName: string;
  email: string;
  country: string;
  city: string;
  description: string;
  url: string;
  socials?: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
    bandcamp?: string;
  };
}

// Radio Outreach Types
export interface RadioContact {
  id: string;
  name: string; // DJ or Music Director
  stationName: string;
  email: string;
  country?: string;
  city?: string;
  genres?: string;
  submissionUrl?: string;
  notes?: string;
  bandId: string;
}

export interface RadioOpportunity {
  stationName: string;
  contactName: string;
  email: string;
  country: string;
  city: string;
  description: string; // Genres played
  url: string;
}


// Fanbase & Newsletter Types
export interface FanContact {
  id: string;
  name: string;
  email: string;
  origin: 'Manual' | 'CSV Import' | 'Website Signup' | string;
  dateAdded: string;
  bandId: string;
}

// Reports & Analytics Types
export interface Insight {
  id: string;
  text: string;
  severity: 'info' | 'warning' | 'opportunity';
  action: {
    label: string;
    page: Page;
    params?: Record<string, string>;
  };
}

export type ReportDataSource = 'Tasks' | 'Transactions' | 'Shows' | 'Releases';
export type ReportDisplay = 'Table' | 'BarChart' | 'PieChart' | 'List';
export type ReportDateRange = 'all_time' | 'last_7_days' | 'last_30_days' | 'this_month' | 'this_quarter' | 'this_year';

export interface ReportConfig {
    id: string;
    name: string;
    dataSource: ReportDataSource;
    displayAs: ReportDisplay;
    filters: {
        // Task Filters
        projectId?: string;
        status?: TaskStatus;
        priority?: TaskPriority;
        assignedToId?: string;

        // Transaction Filters
        type?: TransactionType;
        category?: string;

        // Generic Filters
        dateRange?: ReportDateRange;
    };
    groupBy?: string; // e.g., 'category', 'month', 'status'
    bandId: string;
}

// --- NEW WIZARD-DRIVEN TYPES ---
export interface LastSearchParams {
  labels?: { genre: string; country: string; size: string; labelName: string; similarToLabel?: string; };
  press?: { artistName: string; pubType: string; country: string };
  venues?: { style: string; city: string; capacity: string };
  openingSlots?: { city: string; genre: string; dateRange: string };
}

export type WizardSuggestionType = 'new_labels' | 'new_press' | 'new_venues' | 'new_openings' | 'festival_application_window';

export interface WizardSuggestion {
    id: string;
    type: WizardSuggestionType;
    text: string;
    action: {
        page: Page;
        data?: any; // To pass new results or context to the page
    };
    festivalData?: FestivalDirectoryEntry;
}

// --- NEW INVOICING TYPES ---
export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Overdue';

export interface InvoiceItem {
    description: string;
    quantity: number;
    unitPrice: number;
}

export interface Invoice {
    id: string;
    transactionId: string;
    bandId: string;
    invoiceNumber: string;
    invoiceDate: string;
    dueDate: string;
    status: InvoiceStatus;
    issuer: {
        name: string;
        address: string;
        taxId: string;
        bankDetails: string;
    };
    recipient: {
        name: string;
        address: string;
    };
    items: InvoiceItem[];
    notes?: string;
    total: number;
}

export interface BandSettings {
    issuerName: string;
    issuerAddress: string;
    issuerTaxId: string;
    issuerBankDetails: string;
}

// --- NEW FINANCIALS TYPES ---
export interface CashHolding {
  id: string;
  memberId: string; // links to User.id, or 'safe'
  amount: number;
  bandId: string;
}

export enum MemberTransactionType {
  Withdrawal = 'Withdrawal', // Member takes cash from band
  Contribution = 'Contribution', // Member pays for band expense
  Settlement = 'Settlement', // Band pays/is paid to settle balance
}

export interface MemberTransaction {
  id: string;
  memberId: string; // links to User.id
  type: MemberTransactionType;
  amount: number; // always positive
  description: string;
  date: string;
  bandId: string;
}

// --- NEW SOUND MATCH TYPES ---
export interface SoundProfileAnalysis {
    artistName: string;
    genres: string[];
    moods: string[];
    instrumentation: string[];
    tempo: string;
    summary: string;
    similarArtists: string[];
    reasoning: string;
}

export interface SoundMatchOpportunity {
    type: 'press' | 'radio';
    name: string; // Contact name
    outlet: string; // Blog, station name
    email: string;
    country: string;
    url: string; // Article, station URL
    sourceArtist: string; // The artist that was the source of this find
}
