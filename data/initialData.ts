
import { TaskStatus, EventType, TransactionType, ContactTier, ReleaseType, TaskPriority, RoyaltySource, SongStatus, ProjectType, Daw, ProductionProjectStatus, CampaignType, GigStatus } from '../types';
import type { Task, CalendarEvent, Transaction, Budget, PressContact, MerchItem, Release, Tour, Setlist, Collaborator, User, LockedDate, FundingApplication, Festival, BandGoal, MediaAsset, SaasSubscription, PublishedArticle, RoyaltyStatement, Song, ProductionProject, BandProfile, EmailCampaign, Promoter, LabelContact, RadioContact, ReportConfig, Gig, FanContact, Invoice, BandSettings, CashHolding, MemberTransaction, Venue, OpeningSlotOpportunity, SavedFundingOpportunity, SavedResidency } from '../types';

// SAFETY NOTE: this app intentionally boots with empty default data.
// Demo band content was removed to avoid placeholder noise and to force a real onboarding flow
// that asks the user for actual band information instead of fake content.

export const initialBandProfiles: BandProfile[] = [];

export const initialUsers: User[] = [];

const bandMemberIds: string[] = [];
const defaultBandId = 'band-1';

export const initialTasks: Task[] = [];

export const initialEvents: CalendarEvent[] = [];

export const initialLockedDates: LockedDate[] = [];

export const initialTransactions: Transaction[] = [];

export const initialBudgets: Budget[] = [];

export const initialPressContacts: PressContact[] = [];

export const initialLabelContacts: LabelContact[] = [];
export const initialRadioContacts: RadioContact[] = [];

export const initialFanContacts: FanContact[] = [];

export const initialPublishedArticles: PublishedArticle[] = [];

export const initialMerch: MerchItem[] = [];

export const initialReleases: Release[] = [];

export const initialSetlists: Setlist[] = [];

export const initialTours: Tour[] = [];

export const initialCollaborators: Collaborator[] = [];

export const initialGigs: Gig[] = [];

export const initialVenues: Venue[] = [];
export const initialOpeningSlots: OpeningSlotOpportunity[] = [];
export const initialSavedFundingOpps: SavedFundingOpportunity[] = [];
export const initialSavedResidencies: SavedResidency[] = [];

// NEW PRODUCTION DATA
export const initialSongs: Song[] = [];

export const songChecklistTemplate: Array<Omit<Task, 'id' | 'bandId' | 'projectId' | 'songId' | 'dueDate'>> = [];

export const initialProductionProjects: ProductionProject[] = [];

export const initialFundingApplications: FundingApplication[] = [];

export const initialFestivals: Festival[] = [];

export const initialGoals: BandGoal[] = [];

export const initialMediaAssets: MediaAsset[] = [];

export const initialSaasSubscriptions: SaasSubscription[] = [];

export const initialRoyalties: RoyaltyStatement[] = [];

export const initialCampaigns: EmailCampaign[] = [];

export const initialPromoters: Promoter[] = [];

export const initialReports: ReportConfig[] = [];

export const initialInvoices: Invoice[] = [];

export const initialBandSettings: BandSettings = {
    issuerName: '',
    issuerAddress: '',
    issuerTaxId: '',
    issuerBankDetails: '',
    mailchimpApiKey: '',
    mailchimpServerPrefix: '',
    mailchimpAudienceId: '',
    mailchimpFromName: '',
    mailchimpReplyTo: ''
};

export const initialCashHoldings: CashHolding[] = [];
export const initialMemberTransactions: MemberTransaction[] = [];


// DEPRECATED, DO NOT USE
// export const initialBandProfile: BandProfile = {
//     id: 'b1', name: "LOVNIS", genre: "Indie Rock, Dream Pop, Shozegaze"
// };
