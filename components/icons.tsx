
import React from 'react';

const Icon: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        {children}
    </svg>
);

export const DashboardIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><rect width="7" height="9" x="3" y="3" rx="1"></rect><rect width="7" height="5" x="14" y="3" rx="1"></rect><rect width="7" height="9" x="14" y="12" rx="1"></rect><rect width="7" height="5" x="3" y="16" rx="1"></rect></Icon>;
export const ProjectsIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><rect width="18" height="18" x="3" y="3" rx="2"></rect><path d="M9 3v18"></path></Icon>;
export const CalendarIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect><line x1="16" x2="16" y1="2" y2="6"></line><line x1="8" x2="8" y1="2" y2="6"></line><line x1="3" x2="21" y1="10" y2="10"></line></Icon>;
export const FinancialsIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><line x1="12" x2="12" y1="2" y2="22"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></Icon>;
export const PressIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><path d="M22 12h-6l-2 3h-4l-2-3H2"></path><path d="M5 12v6c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2v-6"></path><path d="M15 12V3c0-1.1-.9-2-2-2H9c-1.1 0-2 .9-2 2v9"></path></Icon>;
export const MerchIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path><line x1="3" x2="21" y1="6" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></Icon>;
export const ReleaseIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="4"></circle><line x1="12" x2="12" y1="2" y2="4"></line><line x1="12" x2="12" y1="20" y2="22"></line><line x1="2" x2="4" y1="12" y2="12"></line><line x1="20" x2="22" y1="12" y2="12"></line></Icon>;
export const TourIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"></path><path d="M20 10c0 4.4-8 12-8 12s-8-7.6-8-12a8 8 0 0 1 16 0Z"></path></Icon>;
export const SetlistIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><path d="M8 6h10"></path><path d="M6 12h10"></path><path d="M8 18h10"></path><path d="M4 6.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"></path><path d="M4 12.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"></path><path d="M4 18.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"></path></Icon>;
export const CollaboratorIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></Icon>;
export const ResourcesIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></Icon>;
export const SettingsIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></Icon>;
export const PlusIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><path d="M5 12h14"></path><path d="M12 5v14"></path></Icon>;
export const TrashIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></Icon>;
export const SearchIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></Icon>;
export const BotIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><path d="M12 8V4H8"></path><rect width="16" height="12" x="4" y="8" rx="2"></rect><path d="M2 14h2"></path><path d="M20 14h2"></path><path d="M15 13v2"></path><path d="M9 13v2"></path></Icon>;
export const SendIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><path d="m22 2-7 20-4-9-9-4Z"></path><path d="M22 2 11 13"></path></Icon>;
export const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><path d="m6 9 6 6 6-6"></path></Icon>;
export const MoreVerticalIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></Icon>;
export const ExternalLinkIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" x2="21" y1="14" y2="3"></line></Icon>;
export const CopyIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></Icon>;
export const PowerIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><path d="M12 2v10"></path><path d="M18.4 6.6a9 9 0 1 1-12.77.04"></path></Icon>;
export const UploadCloudIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path><path d="M12 12v9"></path><path d="m16 16-4-4-4 4"></path></Icon>;
export const FileIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></Icon>;
export const InfoIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><circle cx="12" cy="12" r="10"></circle><line x1="12" x2="12" y1="16" y2="12"></line><line x1="12" x2="12.01" y1="8" y2="8"></line></Icon>;
export const SlashIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></Icon>;
export const ChevronLeftIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><path d="m15 18-6-6 6-6"></path></Icon>;
export const ChevronRightIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><path d="m9 18 6-6-6-6"></path></Icon>;
export const ClockIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></Icon>;
export const FileTextIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" x2="8" y1="13" y2="13"></line><line x1="16" x2="8" y1="17" y2="17"></line><line x1="10" x2="8" y1="9" y2="9"></line></Icon>;
export const UsersIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></Icon>;
export const CodeIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></Icon>;
export const ArrowRightIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></Icon>;


// New Icons
export const ProductionIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><path d="M12 22a2.5 2.5 0 0 0 2.5-2.5V17a2.5 2.5 0 0 0-5 0v2.5A2.5 2.5 0 0 0 12 22Z"></path><path d="M12 17V2"></path><path d="m15 2-3 3-3-3"></path><path d="m9.5 14.5 12 17l2.5-2.5"></path><path d="M14 6.5a2.5 2.5 0 0 0-5 0"></path><path d="M14 10.5a2.5 2.5 0 0 0-5 0"></path></Icon>;
export const FundingIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><path d="m7 11 5-5 5 5"></path><path d="m7 17 5-5 5 5"></path><circle cx="12" cy="12" r="10"></circle></Icon>;
export const FestivalIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Z"></path><path d="m7 13 5 2 5-2"></path><path d="M10 9v4"></path><path d="M14 9v4"></path></Icon>;
export const GoalsIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></Icon>;
export const MediaArchiveIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="M6 4V2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2"></path><path d="M2 10h20"></path></Icon>;
export const EPKIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><path d="M12 22h6a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v3"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M2 15h6"></path><path d="M5 12v6"></path></Icon>;
export const LockIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></Icon>;
export const RoyaltiesIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></Icon>;
export const BookingIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></Icon>;

// New Icons for Goals
export const TrophyIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></Icon>;
export const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></Icon>;

// New Icons for EPK
export const MusicIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></Icon>;
export const VideoIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><path d="m22 8-6 4 6 4V8Z"></path><rect width="14" height="12" x="2" y="6" rx="2" ry="2"></rect></Icon>;
export const ImageIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path></Icon>;
export const LinkIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"></path></Icon>;
export const EditIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path></Icon>;

// Icons for Production Studio
export const FolderIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L8.6 3.3A2 2 0 0 0 6.9 2H4a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h16z"></path></Icon>;
export const MicIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" x2="12" y1="19" y2="22"></line></Icon>;
export const SlidersIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><line x1="4" x2="4" y1="21" y2="14"></line><line x1="4" x2="4" y1="10" y2="3"></line><line x1="12" x2="12" y1="21" y2="12"></line><line x1="12" x2="12" y1="8" y2="3"></line><line x1="20" x2="20" y1="21" y2="16"></line><line x1="20" x2="20" y1="12" y2="3"></line><line x1="2" x2="6" y1="14" y2="14"></line><line x1="10" x2="14" y1="8" y2="8"></line><line x1="18" x2="22" y1="16" y2="16"></line></Icon>;
export const WaveformIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><path d="M2 12h3l3-9 4 18 3-9h3"></path></Icon>;
export const ArchiveIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><rect width="20" height="5" x="2" y="3" rx="1"></rect><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"></path><path d="M10 12h4"></path></Icon>;
export const MapPinIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></Icon>;
export const WandIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><path d="M13.66 2.34 22 10.69l-2 2-8.34-8.35-2-2z" /><path d="m11.5 2.5 1 1" /><path d="M3 14.5 9.5 21" /><path d="M3 21h3v-3" /><path d="M18 12.5 11.5 6" /><path d="M6 3 3 6" /><path d="M21 21 18 18" /></Icon>;
export const PlusCircleIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><circle cx="12" cy="12" r="10"></circle><line x1="12" x2="12" y1="8" y2="16"></line><line x1="8" x2="16" y1="12" y2="12"></line></Icon>;


// Icons for Campaigns
export const MailIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></Icon>;
export const SaveIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></Icon>;
export const EyeIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></Icon>;
export const MousePointerClickIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><path d="m9 9 5 12 1.8-5.2L21 14Z"></path><path d="M3 3v7h7"></path></Icon>;


// Icon for Dashboard Suggestions
export const RefreshCwIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></Icon>;

// Icon for Labels
export const BuildingIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M12 6h.01"></path><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path></Icon>;
export const RadioIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"/></Icon>;
export const MegaphoneIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></Icon>;
export const SoundMatchIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><path d="M7 11h1l1 2 2-4 2 4 1-2h1"/></Icon>;


// Icons for Reports
export const BarChartIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><line x1="12" x2="12" y1="20" y2="10"></line><line x1="18" x2="18" y1="20" y2="4"></line><line x1="6" x2="6" y1="20" y2="16"></line></Icon>;
export const LightbulbIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"></path><path d="M9 18h6"></path><path d="M10 22h4"></path></Icon>;

// Icons for Settings (Danger Zone)
export const AlertTriangleIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" x2="12" y1="9" y2="13"></line><line x1="12" x2="12.01" y1="17" y2="17"></line></Icon>;
export const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" x2="12" y1="15" y2="3"></line></Icon>;
export const UploadIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" x2="12" y1="3" y2="15"></line></Icon>;

// New Icon for Stage Plot
export const StageIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><rect x="3" y="3" width="18" height="18" rx="2" /><rect x="7" y="7" width="4" height="4" rx="1" /><rect x="13" y="7" width="4" height="4" rx="1" /><rect x="7" y="13" width="10" height="4" rx="1" /></Icon>;

// New Icon for Invoicing
export const InvoiceIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M12 18V6"></path><path d="M15 9H9.5a2.5 2.5 0 0 0 0 5h3a2.5 2.5 0 0 1 0 5H9"></path></Icon>;

// New Icon for Member Balances
export const HandCoinsIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><path d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17"/><path d="M7 21h8a2 2 0 0 0 2-2v-1a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v1a2 2 0 0 0 2 2Z"/><circle cx="8" cy="8" r="3"/><path d="M18.2 12.8a3 3 0 0 1-2.2 4.2"/><path d="M15 13a3 3 0 0 1 3-3"/></Icon>;

// New Icon for Residencies
export const HomeIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></Icon>;

// Social Icons
export const InstagramIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line></Icon>;
export const TwitterIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></Icon>;
export const FacebookIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></Icon>;
export const BandcampIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><path d="m12 6-6 6h12Z M6 12v6h12v-6Z"></path></Icon>;
