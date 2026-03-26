
import React, { useState } from 'react';
import type { Page, User, BandProfile } from '../types';
import { 
    DashboardIcon, ProjectsIcon, CalendarIcon, FinancialsIcon, PressIcon, MerchIcon, ReleaseIcon, TourIcon, SetlistIcon, CollaboratorIcon, ResourcesIcon, SettingsIcon,
    ProductionIcon, FundingIcon, FestivalIcon, GoalsIcon, MediaArchiveIcon, EPKIcon, BookingIcon, RoyaltiesIcon, MailIcon, BuildingIcon, BarChartIcon, UsersIcon, PlusIcon, EditIcon, StageIcon, RadioIcon, MegaphoneIcon,
    SoundMatchIcon, InvoiceIcon, SaveIcon, SlashIcon, HomeIcon, TerminalIcon
} from './icons';

interface SidebarProps {
  currentPage: Page;
  bands: BandProfile[];
  activeBandId: string;
  onBandChange: (id: string) => void;
  onNewBandClick: () => void;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

const BandSwitcher: React.FC<{
    bands: BandProfile[];
    activeBandId: string;
    onBandChange: (id: string) => void;
    onNewBandClick: () => void;
}> = ({ bands, activeBandId, onBandChange, onNewBandClick }) => (
    <div className="px-2 mb-4">
        <label htmlFor="band-switcher" className="text-xs font-medium text-gray-500 uppercase tracking-wider">Current Band</label>
        <select
            id="band-switcher"
            value={activeBandId}
            onChange={(e) => onBandChange(e.target.value)}
            className="w-full bg-brand-bg-card text-white p-2 rounded-md mt-1 border border-brand-border focus:outline-none focus:ring-2 focus:ring-brand-accent"
            aria-label="Switch active band"
        >
            {bands.map(band => (
                <option key={band.id} value={band.id}>{band.name}</option>
            ))}
        </select>
        <button
            onClick={onNewBandClick}
            className="w-full text-xs text-center mt-2 p-2 bg-brand-bg-card/50 hover:bg-brand-bg-card rounded-md text-gray-400 hover:text-white transition-colors flex items-center justify-center"
        >
            <PlusIcon className="w-4 h-4 mr-1"/> Create a new band
        </button>
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

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, bands, activeBandId, onBandChange, onNewBandClick, users, setUsers }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const mainNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon className="h-5 w-5" /> },
    { id: 'projects', label: 'Projects', icon: <ProjectsIcon className="h-5 w-5" /> },
    { id: 'calendar', label: 'Calendar', icon: <CalendarIcon className="h-5 w-5" /> },
    { id: 'reports', label: 'Reports', icon: <BarChartIcon className="h-5 w-5" /> },
  ];

  const creationNavItems = [
    { id: 'production', label: 'Production', icon: <ProductionIcon className="h-5 w-5" /> },
    { id: 'releases', label: 'Releases', icon: <ReleaseIcon className="h-5 w-5" /> },
    { id: 'setlists', label: 'Setlists', icon: <SetlistIcon className="h-5 w-5" /> },
  ];

  const businessNavItems = [
    { id: 'gigs', label: 'Gigs', icon: <BookingIcon className="h-5 w-5" /> },
    { id: 'tours', label: 'Tours', icon: <TourIcon className="h-5 w-5" /> },
    { id: 'stage', label: 'Stage Plot', icon: <StageIcon className="h-5 w-5" /> },
    { id: 'merch', label: 'Merchandise', icon: <MerchIcon className="h-5 w-5" /> },
    { id: 'press', label: 'Press Outreach', icon: <PressIcon className="h-5 w-5" /> },
    { id: 'radio', label: 'Radio Outreach', icon: <RadioIcon className="h-5 w-5" /> },
    { id: 'label', label: 'Label Reachout', icon: <BuildingIcon className="h-5 w-5" /> },
    { id: 'campaigns', label: 'Campaigns', icon: <MailIcon className="h-5 w-5" /> },
    { id: 'social', label: 'Social Studio', icon: <MegaphoneIcon className="h-5 w-5" /> },
    { id: 'fanbase', label: 'Fanbase', icon: <UsersIcon className="h-5 w-5" /> },
    { id: 'epk', label: 'EPK Generator', icon: <EPKIcon className="h-5 w-5" /> },
    { id: 'financials', label: 'Financials', icon: <FinancialsIcon className="h-5 w-5" /> },
    { id: 'invoices', label: 'Invoices', icon: <InvoiceIcon className="h-5 w-5" /> },
    { id: 'royalties', label: 'Royalties', icon: <RoyaltiesIcon className="h-5 w-5" /> },
  ];
  
  const growthNavItems = [
    { id: 'goals', label: 'Goals', icon: <GoalsIcon className="h-5 w-5" /> },
    { id: 'sound-match', label: 'Sound Match', icon: <SoundMatchIcon className="h-5 w-5" /> },
    { id: 'funding', label: 'Funding', icon: <FundingIcon className="h-5 w-5" />},
    { id: 'residencies', label: 'Residencies', icon: <HomeIcon className="h-5 w-5" />},
    { id: 'festivals', label: 'Festivals', icon: <FestivalIcon className="h-5 w-5" /> },
    { id: 'collaborators', label: 'Collaborators', icon: <CollaboratorIcon className="h-5 w-5" /> },
    
  ]

  const managementNavItems = [
    { id: 'media', label: 'Media Archive', icon: <MediaArchiveIcon className="h-5 w-5" />},
    { id: 'resources', label: 'Resources', icon: <ResourcesIcon className="h-5 w-5" /> },
    { id: 'system-status', label: 'System Status', icon: <TerminalIcon className="h-5 w-5" /> },
  ];
  
  const settingsItem = { id: 'settings', label: 'Settings', icon: <SettingsIcon className="h-5 w-5" /> };
  
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
        className="fixed top-3 left-3 z-[60] p-2 bg-brand-bg-card rounded-md border border-brand-border lg:hidden text-white"
    >
        <SlashIcon className="w-6 h-6" />
    </button>

    {/* Overlay for mobile */}
    {isMobileOpen && <div className="fixed inset-0 bg-black/50 z-[55] lg:hidden" onClick={() => setIsMobileOpen(false)} />}

    <aside className={`flex flex-col w-64 bg-brand-bg-sidebar text-gray-100 min-h-screen p-4 fixed lg:sticky top-0 h-screen overflow-y-auto border-r border-brand-border z-[60] transition-transform duration-300 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
      <div className="flex items-center mb-6 flex-shrink-0 px-2 pt-2 lg:pt-0 pl-10 lg:pl-2">
        <h1 className="text-2xl font-medium text-white tracking-widest">BAND<span className="text-brand-accent">HQ</span></h1>
      </div>

      {currentUser.systemRole === 'Admin' && (
        <BandSwitcher bands={bands} activeBandId={activeBandId} onBandChange={onBandChange} onNewBandClick={onNewBandClick} />
      )}

      <div className="px-2 mb-6">
        <div className="w-full flex items-center justify-center text-xs p-2 bg-brand-bg-card/50 rounded-md text-gray-400 h-10">
            <SaveIcon className="w-4 h-4 mr-2 text-green-400" />
            <span>All changes are saved automatically.</span>
        </div>
      </div>

      <nav className="flex-grow">
        <NavSectionHeader title="Core" />
        <ul>
          {mainNavItems.map(item => <NavItem key={item.id} icon={item.icon} label={item.label} page={item.id as Page} isActive={currentPage === item.id} onClick={() => setIsMobileOpen(false)} />)}
        </ul>
        <NavSectionHeader title="Creation" />
        <ul>
            {creationNavItems.map(item => <NavItem key={item.id} icon={item.icon} label={item.label} page={item.id as Page} isActive={currentPage === item.id} onClick={() => setIsMobileOpen(false)} />)}
        </ul>
        <NavSectionHeader title="Business" />
        <ul>
            {businessNavItems.map(item => <NavItem key={item.id} icon={item.icon} label={item.label} page={item.id as Page} isActive={currentPage === item.id} onClick={() => setIsMobileOpen(false)} />)}
        </ul>
        <NavSectionHeader title="Growth" />
        <ul>
            {growthNavItems.map(item => <NavItem key={item.id} icon={item.icon} label={item.label} page={item.id as Page} isActive={currentPage === item.id} onClick={() => setIsMobileOpen(false)} />)}
        </ul>
         <NavSectionHeader title="Management" />
        <ul>
            {managementNavItems.map(item => <NavItem key={item.id} icon={item.icon} label={item.label} page={item.id as Page} isActive={currentPage === item.id} onClick={() => setIsMobileOpen(false)} />)}
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
