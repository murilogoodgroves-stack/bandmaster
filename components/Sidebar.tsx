
import React, { useState } from 'react';
import type { Page, User, BandProfile } from '../types';
import { 
    DashboardIcon, ProjectsIcon, CalendarIcon, FinancialsIcon, PressIcon, MerchIcon, ReleaseIcon, TourIcon, SetlistIcon, CollaboratorIcon, ResourcesIcon, SettingsIcon,
    ProductionIcon, FundingIcon, FestivalIcon, GoalsIcon, MediaArchiveIcon, EPKIcon, BookingIcon, RoyaltiesIcon, MailIcon, BuildingIcon, BarChartIcon, UsersIcon, PlusIcon, EditIcon, StageIcon, RadioIcon, MegaphoneIcon,
    SoundMatchIcon, InvoiceIcon, SaveIcon, SlashIcon, HomeIcon, TerminalIcon, QuestionMarkCircleIcon, ChevronDownIcon
} from './icons';
import { FiMenu } from 'react-icons/fi';
import { useTranslation } from '../hooks/useTranslation';

interface SidebarProps {
  currentPage: Page;
  bands: BandProfile[];
  activeBandId: string;
  onBandChange: (id: string) => void;
  onNewBandClick: () => void;
  onHelpClick: () => void;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

const BandSwitcher: React.FC<{
    bands: BandProfile[];
    activeBandId: string;
    onBandChange: (id: string) => void;
    onNewBandClick: () => void;
    isAdmin: boolean;
}> = ({ bands, activeBandId, onBandChange, onNewBandClick, isAdmin }) => (
    <div className="px-2 mb-6">
        <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
                {isAdmin ? 'Switch Band' : 'Current Band'}
            </label>
        </div>
        <div className="flex items-center gap-2">
            <div className="relative flex-grow">
                <select
                    id="band-switcher"
                    value={activeBandId}
                    onChange={(e) => onBandChange(e.target.value)}
                    disabled={!isAdmin && bands.length <= 1}
                    className={`w-full bg-brand-bg-card/50 text-white text-sm font-medium p-2 pr-8 rounded-lg border border-brand-border focus:outline-none focus:ring-1 focus:ring-brand-accent/50 transition-all appearance-none ${isAdmin || bands.length > 1 ? 'cursor-pointer hover:border-brand-accent/50' : 'cursor-default'}`}
                    aria-label="Switch active band"
                >
                    {bands.map(band => (
                        <option key={band.id} value={band.id}>{band.name}</option>
                    ))}
                </select>
                {(isAdmin || bands.length > 1) && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                    </div>
                )}
            </div>
            {isAdmin && (
                <button 
                    onClick={onNewBandClick}
                    className="p-2 bg-brand-accent/10 hover:bg-brand-accent/20 rounded-lg text-brand-accent transition-colors flex-shrink-0 border border-brand-accent/20"
                    title="Create new band"
                >
                    <PlusIcon className="w-4 h-4" />
                </button>
            )}
        </div>
    </div>
);


const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  page: Page;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, page, isActive, onClick }) => {
  const baseClasses = "flex items-center px-3 py-2 my-1 rounded-md cursor-pointer transition-colors duration-200 border-l-4";
  const activeClasses = "bg-brand-accent/10 border-brand-accent text-white";
  const inactiveClasses = "text-gray-400 hover:bg-white/5 hover:text-white border-transparent";

  return (
    <li onClick={() => { window.location.hash = page; onClick(); }}>
      <a className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}>
        {icon}
        <span className="mx-3">{label}</span>
      </a>
    </li>
  );
};

const NavSectionHeader: React.FC<{ title: string }> = ({ title }) => (
    <h3 className="px-3 text-xs font-medium text-gray-500 uppercase tracking-wider my-3 mt-6">
        {title}
    </h3>
);

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, bands, activeBandId, onBandChange, onNewBandClick, onHelpClick, users, setUsers }) => {
  const { t } = useTranslation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const managementNavItems = [
    { id: 'dashboard', label: t('sidebar.dashboard'), icon: <DashboardIcon className="h-5 w-5" /> },
    { id: 'projects', label: t('sidebar.projects'), icon: <ProjectsIcon className="h-5 w-5" /> },
    { id: 'calendar', label: t('sidebar.calendar'), icon: <CalendarIcon className="h-5 w-5" /> },
    { id: 'reports', label: t('sidebar.reports'), icon: <BarChartIcon className="h-5 w-5" /> },
    { id: 'goals', label: t('sidebar.goals'), icon: <GoalsIcon className="h-5 w-5" /> },
  ];

  const creativeNavItems = [
    { id: 'production', label: t('sidebar.production'), icon: <ProductionIcon className="h-5 w-5" /> },
    { id: 'releases', label: t('sidebar.releases'), icon: <ReleaseIcon className="h-5 w-5" /> },
    { id: 'setlists', label: t('sidebar.setlists'), icon: <SetlistIcon className="h-5 w-5" /> },
    { id: 'media', label: t('sidebar.mediaArchive'), icon: <MediaArchiveIcon className="h-5 w-5" />},
    { id: 'stage', label: t('sidebar.stagePlot'), icon: <StageIcon className="h-5 w-5" /> },
  ];

  const liveNavItems = [
    { id: 'gigs', label: t('sidebar.gigs'), icon: <BookingIcon className="h-5 w-5" /> },
    { id: 'tours', label: t('sidebar.tours'), icon: <TourIcon className="h-5 w-5" /> },
    { id: 'residencies', label: t('sidebar.residencies'), icon: <HomeIcon className="h-5 w-5" />},
    { id: 'festivals', label: t('sidebar.festivals'), icon: <FestivalIcon className="h-5 w-5" /> },
  ];

  const promotionNavItems = [
    { id: 'campaigns', label: t('sidebar.campaigns'), icon: <MailIcon className="h-5 w-5" /> },
    { id: 'press', label: t('sidebar.pressOutreach'), icon: <PressIcon className="h-5 w-5" /> },
    { id: 'radio', label: t('sidebar.radioOutreach'), icon: <RadioIcon className="h-5 w-5" /> },
    { id: 'label', label: t('sidebar.labelReachout'), icon: <BuildingIcon className="h-5 w-5" /> },
    { id: 'sound-match', label: t('sidebar.soundMatch'), icon: <SoundMatchIcon className="h-5 w-5" /> },
    { id: 'epk', label: t('sidebar.epk'), icon: <EPKIcon className="h-5 w-5" /> },
    { id: 'social', label: t('sidebar.socialStudio'), icon: <MegaphoneIcon className="h-5 w-5" /> },
  ];

  const businessNavItems = [
    { id: 'financials', label: t('sidebar.financials'), icon: <FinancialsIcon className="h-5 w-5" /> },
    { id: 'invoices', label: t('sidebar.invoices'), icon: <InvoiceIcon className="h-5 w-5" /> },
    { id: 'royalties', label: t('sidebar.royalties'), icon: <RoyaltiesIcon className="h-5 w-5" /> },
    { id: 'merch', label: t('sidebar.merchandise'), icon: <MerchIcon className="h-5 w-5" /> },
    { id: 'funding', label: t('sidebar.funding'), icon: <FundingIcon className="h-5 w-5" />},
  ];
  
  const networkNavItems = [
    { id: 'fanbase', label: t('sidebar.fanbase'), icon: <UsersIcon className="h-5 w-5" /> },
    { id: 'collaborators', label: t('sidebar.collaborators'), icon: <CollaboratorIcon className="h-5 w-5" /> },
  ]

  const systemNavItems = [
    { id: 'system-status', label: t('sidebar.systemStatus'), icon: <TerminalIcon className="h-5 w-5" /> },
    { id: 'resources', label: t('sidebar.resources'), icon: <ResourcesIcon className="h-5 w-5" /> },
  ];
  
  const settingsItem = { id: 'settings', label: t('sidebar.settings'), icon: <SettingsIcon className="h-5 w-5" /> };
  
  const currentUser: User = users[0] || { id: 'nouser', name: 'No User', systemRole: 'Member', primaryRole: '', secondaryRoles: [], avatar: '', email: '' };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const newAvatar = event.target?.result as string;
            setUsers(prevUsers => prevUsers.map(u => 
                u.id === currentUser.id ? { ...u, avatar: newAvatar } : u
            ));
        };
        reader.readAsDataURL(e.target.files[0]);
    }
  };

  return (
    <>
    {/* Mobile Toggle */}
    <button 
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed top-3 left-3 z-[60] p-2 bg-brand-bg-card rounded-md border border-brand-border lg:hidden text-white w-10 h-10 flex items-center justify-center"
    >
        <FiMenu size={24} />
    </button>

    {/* Overlay for mobile */}
    {isMobileOpen && <div className="fixed inset-0 bg-black/50 z-[55] lg:hidden" onClick={() => setIsMobileOpen(false)} />}

    <aside className={`flex flex-col w-64 bg-brand-bg-sidebar text-gray-100 min-h-screen p-4 fixed lg:relative top-0 left-0 h-screen overflow-y-auto border-r border-brand-border z-[60] transition-transform duration-300 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
      <div className="flex items-center mb-6 flex-shrink-0 px-2 pt-2 lg:pt-0 pl-10 lg:pl-2 justify-between">
        <div className="flex flex-col">
            <h1 className="text-xl font-bold text-white tracking-tight leading-none truncate max-w-[150px]">
                {bands.find(b => b.id === activeBandId)?.name || 'Band'}
            </h1>
            <span className="text-[10px] text-brand-accent font-bold uppercase tracking-[0.3em] mt-1">Management HQ</span>
        </div>
        {currentUser.systemRole === 'Admin' && (
            <button 
                onClick={onNewBandClick}
                className="p-1.5 bg-brand-accent/10 hover:bg-brand-accent/20 rounded-full text-brand-accent transition-colors border border-brand-accent/20 ml-2"
                title="Create new band"
            >
                <PlusIcon className="w-3.5 h-3.5" />
            </button>
        )}
      </div>

      <BandSwitcher 
        bands={bands} 
        activeBandId={activeBandId} 
        onBandChange={onBandChange} 
        onNewBandClick={onNewBandClick} 
        isAdmin={currentUser.systemRole === 'Admin'} 
      />

      <nav className="mb-4">
        <NavSectionHeader title={t('sidebar.management')} />
        <ul>
          {managementNavItems.map(item => <NavItem key={item.id} icon={item.icon} label={item.label} page={item.id as Page} isActive={currentPage === item.id} onClick={() => setIsMobileOpen(false)} />)}
        </ul>

        <NavSectionHeader title={t('sidebar.creative')} />
        <ul>
          {creativeNavItems.map(item => <NavItem key={item.id} icon={item.icon} label={item.label} page={item.id as Page} isActive={currentPage === item.id} onClick={() => setIsMobileOpen(false)} />)}
        </ul>

        <NavSectionHeader title={t('sidebar.booking')} />
        <ul>
          {liveNavItems.map(item => <NavItem key={item.id} icon={item.icon} label={item.label} page={item.id as Page} isActive={currentPage === item.id} onClick={() => setIsMobileOpen(false)} />)}
        </ul>

        <NavSectionHeader title={t('sidebar.growth')} />
        <ul>
          {promotionNavItems.map(item => <NavItem key={item.id} icon={item.icon} label={item.label} page={item.id as Page} isActive={currentPage === item.id} onClick={() => setIsMobileOpen(false)} />)}
        </ul>

        <NavSectionHeader title={t('sidebar.business')} />
        <ul>
          {businessNavItems.map(item => <NavItem key={item.id} icon={item.icon} label={item.label} page={item.id as Page} isActive={currentPage === item.id} onClick={() => setIsMobileOpen(false)} />)}
        </ul>

        <NavSectionHeader title={t('sidebar.network')} />
        <ul>
          {networkNavItems.map(item => <NavItem key={item.id} icon={item.icon} label={item.label} page={item.id as Page} isActive={currentPage === item.id} onClick={() => setIsMobileOpen(false)} />)}
        </ul>

        <NavSectionHeader title={t('sidebar.systemStatus')} />
        <ul>
          {systemNavItems.map(item => <NavItem key={item.id} icon={item.icon} label={item.label} page={item.id as Page} isActive={currentPage === item.id} onClick={() => setIsMobileOpen(false)} />)}
        </ul>
      </nav>

      <div className="flex-shrink-0">
         <ul>
           <NavItem
              key={settingsItem.id}
              icon={settingsItem.icon}
              label={settingsItem.label}
              page={settingsItem.id as Page}
              isActive={currentPage === settingsItem.id}
              onClick={() => setIsMobileOpen(false)}
            />
            <NavItem
              key="help-center"
              icon={<QuestionMarkCircleIcon className="h-5 w-5" />}
              label={t('sidebar.helpCenter')}
              page="dashboard"
              isActive={currentPage === 'dashboard'}
              onClick={onHelpClick}
            />
         </ul>
         <div className="border-t border-brand-border my-2"></div>
         <div className="flex items-center p-2">
            <label className="relative group cursor-pointer">
                <img src={currentUser.avatar} alt={currentUser.name} className="h-10 w-10 rounded-full group-hover:opacity-50 transition-opacity" />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <EditIcon className="w-5 h-5 text-white" />
                </div>
                <input
                    type="file"
                    onChange={handleAvatarChange}
                    accept="image/*"
                    className="hidden"
                />
            </label>
            <div className="ml-3">
                <p className="font-medium text-sm text-white">{currentUser.name}</p>
                <p className="text-xs text-gray-400">{currentUser.primaryRole}</p>
            </div>
         </div>
      </div>
    </aside>
    </>
  );
};
