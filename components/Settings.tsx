import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { User, BandProfile, BandSettings } from '../types';
import { PlusIcon, TrashIcon, EditIcon, AlertTriangleIcon, DownloadIcon, UploadIcon, SaveIcon, SlashIcon } from './icons';
import { getAPIUsageStats, getAPIUsageLogs } from '../services/aiService';

interface SettingsProps {
    activeBandId: string;
    bands: BandProfile[];
    setBands: React.Dispatch<React.SetStateAction<BandProfile[]>>;
    users: User[];
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    bandSettings: BandSettings;
    setBandSettings: React.Dispatch<React.SetStateAction<BandSettings>>;
}

const SettingsCard: React.FC<{ title: string, children: React.ReactNode, titleIcon?: React.ReactNode }> = ({ title, children, titleIcon }) => (
    <div className="bg-gray-800 rounded-xl shadow-lg">
        <div className="p-6 border-b border-gray-700 flex items-center">
            {titleIcon}
            <h2 className="text-2xl font-bold text-white">{title}</h2>
        </div>
        <div className="p-6">
            {children}
        </div>
    </div>
);

const getUserAvatarUrl = (user: Pick<User, 'avatar' | 'email' | 'name'>) => {
    const safeAvatar = user.avatar?.trim();
    if (safeAvatar && (safeAvatar.startsWith('data:image/') || safeAvatar.startsWith('http://') || safeAvatar.startsWith('https://'))) {
        return safeAvatar;
    }
    const seed = (user.email || user.name || 'bandmate-user').trim() || 'bandmate-user';
    return `https://i.pravatar.cc/150?u=${encodeURIComponent(seed)}`;
};

const readImageFile = (file: File | null, onSuccess: (dataUrl: string) => void) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result === 'string') onSuccess(result);
    };
    reader.readAsDataURL(file);
};

const InviteMemberModal: React.FC<{
  onClose: () => void;
  onInvite: (user: Omit<User, 'id' | 'secondaryRoles'>) => void;
}> = ({ onClose, onInvite }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [systemRole, setSystemRole] = useState<'Admin' | 'Member' | 'Manager'>('Member');
  const [primaryRole, setPrimaryRole] = useState('');
  const [avatar, setAvatar] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    onInvite({ name, email, systemRole, primaryRole, avatar: avatar || '' });
    onClose();
  };

  const userSystemRoles = ["Admin", "Member", "Manager"];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Invite New Member</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-center mb-2">
            <label className="relative group cursor-pointer">
              <img src={avatar || 'https://placehold.co/120x120/1f2937/ffffff?text=Add+Photo'} alt="Profile preview" className="h-20 w-20 rounded-full object-cover border-2 border-gray-600 group-hover:opacity-80" />
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                <EditIcon className="w-5 h-5 text-white" />
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => readImageFile(e.target.files?.[0] ?? null, setAvatar)}
              />
            </label>
          </div>
          <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} className="w-full bg-gray-700 p-3 rounded-lg" required />
          <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-gray-700 p-3 rounded-lg" required />
          <input type="text" placeholder="Primary Role (e.g., Guitar)" value={primaryRole} onChange={e => setPrimaryRole(e.target.value)} className="w-full bg-gray-700 p-3 rounded-lg" required />
          <select value={systemRole} onChange={e => setSystemRole(e.target.value as any)} className="w-full bg-gray-700 p-3 rounded-lg">
            {userSystemRoles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">Cancel</button>
            <button type="submit" className="bg-spotify-green hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg">Send Invite</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ResetConfirmModal: React.FC<{ onClose: () => void; onConfirm: () => void; onDownloadBackup: () => void; }> = ({ onClose, onConfirm, onDownloadBackup }) => (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md border-t-4 border-red-500">
        <div className="flex items-center mb-4">
            <AlertTriangleIcon className="w-8 h-8 text-red-500 mr-3"/>
            <h2 className="text-2xl font-bold">Are you absolutely sure?</h2>
        </div>
        <p className="text-gray-300 mb-4">This action <span className="font-bold">cannot</span> be undone. This will permanently delete all tasks, financials, projects, and other data associated with this band.</p>
        
        <div className="bg-gray-700/50 p-4 rounded-lg mb-6 text-center">
            <p className="text-sm text-yellow-400 mb-2">We strongly recommend creating a restore point first.</p>
            <button onClick={onDownloadBackup} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm w-full">
                <DownloadIcon className="w-4 h-4 mr-2 inline" /> Download Backup
            </button>
        </div>

        <div className="flex justify-end gap-4">
          <button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 font-bold py-2 px-4 rounded-lg">Cancel</button>
          <button onClick={onConfirm} className="bg-red-600 hover:bg-red-700 font-bold py-2 px-4 rounded-lg">Yes, Reset Data</button>
        </div>
      </div>
    </div>
);

const ImportOptionsModal: React.FC<{ onClose: () => void; onOverwrite: () => void; onImportNew: () => void; }> = ({ onClose, onOverwrite, onImportNew }) => (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
        <div className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Import Options</h2>
            <p className="text-gray-300 mb-6">How would you like to import this data?</p>
            <div className="space-y-4">
                 <button onClick={onOverwrite} className="w-full text-left bg-blue-800 hover:bg-blue-700 p-4 rounded-lg">
                    <h3 className="font-bold">Overwrite Current Band</h3>
                    <p className="text-sm text-blue-200">Replace all data for the currently selected band with the data from this backup.</p>
                </button>
                 <button onClick={onImportNew} className="w-full text-left bg-purple-800 hover:bg-purple-700 p-4 rounded-lg">
                    <h3 className="font-bold">Import as New Band</h3>
                    <p className="text-sm text-purple-200">Create a new, separate band profile using the data from this backup.</p>
                </button>
            </div>
             <div className="flex justify-end mt-6">
                <button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 font-bold py-2 px-4 rounded-lg">Cancel</button>
            </div>
        </div>
    </div>
);

// Isolated User Edit Component to manage local state
const UserEditRow: React.FC<{ user: User; onSave: (u: User) => void; onCancel: () => void }> = ({ user, onSave, onCancel }) => {
    const [localUser, setLocalUser] = useState(user);
    const userSystemRoles = ["Admin", "Member", "Manager"];

    const handleFieldChange = (field: keyof User, value: any) => {
        if (field === 'secondaryRoles') {
            const roles = typeof value === 'string' ? value.split(',').map((s: string) => s.trim()) : [];
            setLocalUser({ ...localUser, secondaryRoles: roles });
        } else {
            setLocalUser({ ...localUser, [field]: value });
        }
    };

    return (
        <div className="p-3 bg-gray-700 rounded-lg">
            <div className="space-y-2">
                <input type="text" value={localUser.name} onChange={e => handleFieldChange('name', e.target.value)} className="w-full bg-gray-800 p-1 rounded-md text-sm font-semibold"/>
                <input type="email" value={localUser.email} onChange={e => handleFieldChange('email', e.target.value)} className="w-full bg-gray-800 p-1 rounded-md text-xs"/>
                <select value={localUser.systemRole} onChange={e => handleFieldChange('systemRole', e.target.value)} className="w-full bg-gray-800 p-1 rounded-md text-xs">
                    {userSystemRoles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <input type="text" value={localUser.primaryRole} onChange={e => handleFieldChange('primaryRole', e.target.value)} placeholder="Primary Role" className="w-full bg-gray-800 p-1 rounded-md text-xs"/>
                <input type="text" value={localUser.secondaryRoles.join(', ')} onChange={e => handleFieldChange('secondaryRoles', e.target.value)} placeholder="Secondary Roles (comma separated)" className="w-full bg-gray-800 p-1 rounded-md text-xs"/>
            </div>
            <div className="flex justify-end gap-2 mt-3">
                <button onClick={onCancel} className="p-1 rounded-full hover:bg-gray-600 text-gray-400" title="Cancel"><SlashIcon className="w-5 h-5" /></button>
                <button onClick={() => onSave(localUser)} className="p-1 rounded-full hover:bg-gray-600 text-green-500" title="Save Changes"><SaveIcon className="w-5 h-5" /></button>
            </div>
        </div>
    );
};

export const Settings: React.FC<SettingsProps> = ({ activeBandId, bands, setBands, users, setUsers, bandSettings, setBandSettings }) => {
    const activeBand = useMemo(() => bands.find(b => b.id === activeBandId) || bands[0], [bands, activeBandId]);
    
    // Local state for immediate UI updates on profile, committed on blur
    const [localProfileName, setLocalProfileName] = useState(activeBand.name);
    const [localProfileGenre, setLocalProfileGenre] = useState(activeBand.genre);

    // Sync local state when active band changes
    useEffect(() => {
        setLocalProfileName(activeBand.name);
        setLocalProfileGenre(activeBand.genre);
        // Load API usage stats
        setApiUsageStats(getAPIUsageStats());
    }, [activeBand]);

    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [apiUsageStats, setApiUsageStats] = useState<any>(null);
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [mailchimpStatus, setMailchimpStatus] = useState('Not configured');
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importedData, setImportedData] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const listDataKeys = [
        'tasks', 'events', 'transactions', 'budgets', 'contacts', 'merch', 'releases',
        'tours', 'setlists', 'collaborators', 'lockedDates', 'fundingApplications',
        'festivals', 'goals', 'media', 'saasSubscriptions', 'publishedArticles',
        'royalties', 'productionSongs', 'productionProjects', 'gigs', 'venues',
        'promoters', 'labelContacts', 'radioContacts', 'fanContacts', 'campaigns', 'invoices',
    ];
    
    const mapDataKeys = [
        'cashOnHandMap', 'splitsMap', 'bandBiosMap', 'epkPhotoIdsMap', 'epkVideoIdsMap'
    ];

    const currentUser = users[0];

    // Commit profile changes to persistent state
    const commitProfileChange = (field: 'name' | 'genre', value: string) => {
      setBands(prevBands =>
        prevBands.map(b =>
          b.id === activeBandId ? { ...b, [field]: value } : b
        )
      );
    };

    const handleSettingsChange = (field: keyof BandSettings, value: string) => {
        setBandSettings(prev => ({ ...prev, [field]: value }));
        if (field === 'mailchimpApiKey' || field === 'mailchimpServerPrefix' || field === 'mailchimpAudienceId') {
            const hasApi = Boolean((field === 'mailchimpApiKey' ? value : bandSettings.mailchimpApiKey) && (field === 'mailchimpServerPrefix' ? value : bandSettings.mailchimpServerPrefix) && (field === 'mailchimpAudienceId' ? value : bandSettings.mailchimpAudienceId));
            setMailchimpStatus(hasApi ? 'Ready for newsletter sends' : 'Not configured');
        }
    };

    const handleSaveUser = (updatedUser: User) => {
        setUsers(prevUsers => prevUsers.map(u => u.id === updatedUser.id ? updatedUser : u));
        setEditingUserId(null);
    };

    const handleInviteMember = (newUserData: Omit<User, 'id' | 'secondaryRoles'>) => {
        const newUser: User = {
            id: `u${Date.now()}`,
            ...newUserData,
            secondaryRoles: [],
            avatar: newUserData.avatar || '',
        };
        setUsers(prev => [...prev, newUser]);
    };

    const handleDeleteUser = (userId: string) => {
        if (users.length <= 1) {
            alert("You cannot remove the last user.");
            return;
        }
        if (window.confirm("Are you sure you want to remove this member? This action cannot be undone.")) {
            setUsers(prev => prev.filter(u => u.id !== userId));
        }
    };
    
    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!currentUser) return;
        const file = e.target.files?.[0];
        if (!file) return;
        readImageFile(file, (newAvatar) => {
            setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, avatar: newAvatar } : u));
        });
    };
    
    const handleExportData = () => {
        const bandData: { [key: string]: any } = {};
        
        // Export list-based data
        listDataKeys.forEach(key => {
            const allItems = JSON.parse(localStorage.getItem(key) || '[]');
            if (Array.isArray(allItems)) {
                bandData[key] = allItems.filter((item: any) => item.bandId === activeBandId);
            } else {
                bandData[key] = [];
            }
        });
        
        // Export map-based data (singletons per band)
        mapDataKeys.forEach(key => {
            const mapData = JSON.parse(localStorage.getItem(key) || '{}');
            bandData[key] = mapData[activeBandId]; // Export only this band's value
        });

        const allBands = JSON.parse(localStorage.getItem('bands') || '[]');
        const bandProfile = allBands.find((b: any) => b.id === activeBandId);
        const exportObj = { exportFormatVersion: 2, bandProfile, data: bandData };
        
        const dataStr = JSON.stringify(exportObj, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${bandProfile.name.replace(/\s/g, '_')}_backup_${new Date().toISOString().substring(0,10)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };
    
    const handleImportFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target?.result as string);
                if (!data.bandProfile || !data.data) {
                    throw new Error("Invalid or corrupted backup file.");
                }
                setImportedData(data);
                setIsImportModalOpen(true);
            } catch (error) {
                alert(error instanceof Error ? error.message : "Failed to read backup file.");
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleImportOverwrite = () => {
        if (!importedData) return;
        const { data } = importedData;
        
        // Overwrite list data
        listDataKeys.forEach(key => {
            const storedValue = localStorage.getItem(key);
            let allItems = storedValue ? JSON.parse(storedValue) : [];
            if (Array.isArray(allItems)) {
                const otherBandsItems = allItems.filter((item: any) => item.bandId !== activeBandId);
                const newItemsForBand = (data[key] || []).map((item: any) => ({ ...item, bandId: activeBandId }));
                localStorage.setItem(key, JSON.stringify([...otherBandsItems, ...newItemsForBand]));
            }
        });
        
        // Overwrite map data
        mapDataKeys.forEach(key => {
            const storedValue = localStorage.getItem(key);
            let map = storedValue ? JSON.parse(storedValue) : {};
            if (data[key] !== undefined) {
                map[activeBandId] = data[key];
                localStorage.setItem(key, JSON.stringify(map));
            }
        });

        const allBands = JSON.parse(localStorage.getItem('bands') || '[]');
        const updatedBands = allBands.map((b: any) => b.id === activeBandId ? { ...importedData.bandProfile, id: activeBandId } : b);
        localStorage.setItem('bands', JSON.stringify(updatedBands));
        alert("Data successfully overwritten. The app will now reload.");
        window.location.reload();
    };

    const handleImportAsNew = () => {
        if (!importedData) return;
        const { bandProfile, data } = importedData;
        const newBandId = `b-${Date.now()}`;
        const newBandProfile = { ...bandProfile, id: newBandId, name: `${bandProfile.name} (Imported)`};
        const allBands = JSON.parse(localStorage.getItem('bands') || '[]');
        localStorage.setItem('bands', JSON.stringify([...allBands, newBandProfile]));
        
        // Import list data
        listDataKeys.forEach(key => {
            const storedValue = localStorage.getItem(key);
            let allItems = storedValue ? JSON.parse(storedValue) : [];
            if (Array.isArray(allItems)) {
                const newItemsForBand = (data[key] || []).map((item: any) => ({ ...item, bandId: newBandId }));
                localStorage.setItem(key, JSON.stringify([...allItems, ...newItemsForBand]));
            }
        });
        
        // Import map data
        mapDataKeys.forEach(key => {
            const storedValue = localStorage.getItem(key);
            let map = storedValue ? JSON.parse(storedValue) : {};
            if (data[key] !== undefined) {
                map[newBandId] = data[key];
                localStorage.setItem(key, JSON.stringify(map));
            }
        });

        localStorage.setItem('activeBandId', JSON.stringify(newBandId));
        alert(`Successfully imported "${newBandProfile.name}". The app will now reload.`);
        window.location.reload();
    };
    
    const handleResetData = () => {
        // Reset list data
        listDataKeys.forEach(key => {
            const storedValue = localStorage.getItem(key);
            if (!storedValue) return;
            let allItems = JSON.parse(storedValue);
            if (Array.isArray(allItems)) {
                const remainingItems = allItems.filter((item: any) => item.bandId !== activeBandId);
                localStorage.setItem(key, JSON.stringify(remainingItems));
            }
        });
        
        // Reset map data
        mapDataKeys.forEach(key => {
            const storedValue = localStorage.getItem(key);
            if (!storedValue) return;
            let map = JSON.parse(storedValue);
            delete map[activeBandId];
            localStorage.setItem(key, JSON.stringify(map));
        });

        // Ensure state is updated before reload
        setIsResetModalOpen(false);
        
        // Update React state to reflect localStorage changes
        const updatedBands = bands.filter(b => b.id !== activeBandId);
        if (updatedBands.length > 0) {
            setBands(updatedBands);
            localStorage.setItem('bands', JSON.stringify(updatedBands));
            localStorage.setItem('activeBandId', JSON.stringify(updatedBands[0].id));
        }
        
        alert("All data for this band has been reset. The app will now reload.");
        window.location.reload();
    };

    if (!activeBand) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold">Settings</h1>
                <button onClick={handleExportData} className="flex items-center bg-spotify-green hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-lg">
                    <DownloadIcon className="h-5 w-5 mr-2" />
                    Create Restore Point (Backup)
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <SettingsCard title="Band Profile">
                        <div className="space-y-4">
                             <div>
                                <label className="block text-sm font-medium text-gray-400">Band Name</label>
                                <input 
                                    type="text" 
                                    name="name"
                                    value={localProfileName}
                                    onChange={(e) => setLocalProfileName(e.target.value)}
                                    onBlur={(e) => commitProfileChange('name', e.target.value)}
                                    className="w-full bg-gray-700 p-2 rounded-lg mt-1" 
                                />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-400">Genre</label>
                                <input 
                                    type="text"
                                    name="genre"
                                    value={localProfileGenre}
                                    onChange={(e) => setLocalProfileGenre(e.target.value)}
                                    onBlur={(e) => commitProfileChange('genre', e.target.value)}
                                    className="w-full bg-gray-700 p-2 rounded-lg mt-1" 
                                />
                            </div>
                        </div>
                    </SettingsCard>
                    <SettingsCard title="Invoice & Issuer Details">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400">Your Band/Company Name</label>
                                <input type="text" name="issuerName" value={bandSettings.issuerName} onChange={e => handleSettingsChange('issuerName', e.target.value)} className="w-full bg-gray-700 p-2 rounded-lg mt-1" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400">Address</label>
                                <textarea name="issuerAddress" value={bandSettings.issuerAddress} onChange={e => handleSettingsChange('issuerAddress', e.target.value)} rows={2} className="w-full bg-gray-700 p-2 rounded-lg mt-1" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400">Tax ID (Steuernummer / USt-IdNr.)</label>
                                <input type="text" name="issuerTaxId" value={bandSettings.issuerTaxId} onChange={e => handleSettingsChange('issuerTaxId', e.target.value)} className="w-full bg-gray-700 p-2 rounded-lg mt-1" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400">Bank Details (for payment)</label>
                                <textarea name="issuerBankDetails" value={bandSettings.issuerBankDetails} onChange={e => handleSettingsChange('issuerBankDetails', e.target.value)} rows={2} className="w-full bg-gray-700 p-2 rounded-lg mt-1" />
                            </div>
                        </div>
                    </SettingsCard>
                    <SettingsCard title="Mailchimp & Newsletter">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-900/50 p-4">
                                <div>
                                    <p className="font-bold text-white">Status</p>
                                    <p className="text-sm text-gray-400">{mailchimpStatus}</p>
                                </div>
                                <span className="text-xs uppercase tracking-wide text-purple-300">Free API compatible</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input type="text" value={bandSettings.mailchimpApiKey || ''} onChange={e => handleSettingsChange('mailchimpApiKey', e.target.value)} placeholder="Mailchimp API key" className="w-full bg-gray-700 p-3 rounded-lg" />
                                <input type="text" value={bandSettings.mailchimpServerPrefix || ''} onChange={e => handleSettingsChange('mailchimpServerPrefix', e.target.value)} placeholder="Server prefix (e.g. us1)" className="w-full bg-gray-700 p-3 rounded-lg" />
                                <input type="text" value={bandSettings.mailchimpAudienceId || ''} onChange={e => handleSettingsChange('mailchimpAudienceId', e.target.value)} placeholder="Audience / list ID" className="w-full bg-gray-700 p-3 rounded-lg" />
                                <input type="text" value={bandSettings.mailchimpFromName || ''} onChange={e => handleSettingsChange('mailchimpFromName', e.target.value)} placeholder="From name" className="w-full bg-gray-700 p-3 rounded-lg" />
                            </div>
                            <input type="email" value={bandSettings.mailchimpReplyTo || ''} onChange={e => handleSettingsChange('mailchimpReplyTo', e.target.value)} placeholder="Reply-to email" className="w-full bg-gray-700 p-3 rounded-lg" />
                            <p className="text-sm text-gray-400">Mailchimp settings are stored safely in the band profile and used by the release newsletter system. The API key is never committed to the repo.</p>
                        </div>
                    </SettingsCard>
                    <div className="bg-gray-800 rounded-xl shadow-lg border-2 border-red-800/50">
                        <div className="p-6 border-b border-red-800/50 flex items-center">
                            <AlertTriangleIcon className="w-6 h-6 mr-3 text-red-500" />
                            <h2 className="text-2xl font-bold text-red-400">Danger Zone</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex justify-between items-center bg-gray-900/50 p-3 rounded-lg"><h3 className="font-semibold text-white">Export Band Data</h3><button onClick={handleExportData} className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-lg text-sm"><DownloadIcon className="w-4 h-4 mr-2"/>Export</button></div>
                             <div className="flex justify-between items-center bg-gray-900/50 p-3 rounded-lg"><h3 className="font-semibold text-white">Import from Backup</h3><input type="file" ref={fileInputRef} onChange={handleImportFileSelect} accept=".json" className="hidden" /><button onClick={() => fileInputRef.current?.click()} className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-lg text-sm"><UploadIcon className="w-4 h-4 mr-2"/>Import</button></div>
                             <div className="flex justify-between items-center bg-gray-900/50 p-3 rounded-lg"><h3 className="font-semibold text-red-400">Reset Band Data</h3><button onClick={() => setIsResetModalOpen(true)} className="flex items-center bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded-lg text-sm"><TrashIcon className="w-4 h-4 mr-2"/>Reset</button></div>
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-1 space-y-8">
                    <SettingsCard title="API Monitoring">
                        {apiUsageStats ? (
                            <div className="space-y-4">
                                <div className="bg-gray-700/50 p-4 rounded-lg">
                                    <h3 className="font-semibold text-sm text-gray-300 mb-3">Usage Summary</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-gray-800 p-3 rounded">
                                            <p className="text-xs text-gray-400">Total Calls</p>
                                            <p className="text-2xl font-bold text-white">{apiUsageStats.totalCalls}</p>
                                        </div>
                                        <div className="bg-gray-800 p-3 rounded">
                                            <p className="text-xs text-gray-400">Last 24h</p>
                                            <p className="text-2xl font-bold text-green-400">{apiUsageStats.last24Hours}</p>
                                        </div>
                                        <div className="bg-gray-800 p-3 rounded">
                                            <p className="text-xs text-gray-400">Successful</p>
                                            <p className="text-2xl font-bold text-emerald-400">{apiUsageStats.successfulCalls}</p>
                                        </div>
                                        <div className="bg-gray-800 p-3 rounded">
                                            <p className="text-xs text-gray-400">Failed</p>
                                            <p className="text-2xl font-bold text-red-400">{apiUsageStats.failedCalls}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-gray-700/50 p-4 rounded-lg">
                                    <h3 className="font-semibold text-sm text-gray-300 mb-3">By Provider</h3>
                                    <div className="space-y-2">
                                        {Object.entries(apiUsageStats.byProvider).map(([provider, data]: [string, any]) => {
                                            const percentage = data.count > 0 ? (data.successful / data.count) * 100 : 0;
                                            const isWarning = percentage < 50;
                                            return (
                                                <div key={provider} className={`p-3 rounded ${isWarning ? 'bg-yellow-500/20 border border-yellow-500/50' : 'bg-gray-800'}`}>
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <p className="font-semibold text-sm">{provider}</p>
                                                            <p className="text-xs text-gray-400">{data.count} calls ({data.successful} OK / {data.failed} failed)</p>
                                                        </div>
                                                        {isWarning && percentage < 50 && (
                                                            <span className="text-xs bg-yellow-500/50 text-yellow-200 px-2 py-1 rounded">⚠️ {Math.round(percentage)}%</span>
                                                        )}
                                                    </div>
                                                    <div className="w-full bg-gray-700 rounded-full h-1">
                                                        <div 
                                                            className={`h-1 rounded-full transition-all ${percentage >= 70 ? 'bg-green-500' : percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="bg-blue-600/20 border border-blue-500/50 p-3 rounded-lg">
                                    <p className="text-xs text-blue-200">💡 The system automatically rotates between OpenRouter → Groq → MiniMax → Gemini to keep things running even when one provider hits a limit.</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-400">Loading API data...</p>
                        )}
                    </SettingsCard>

                    <SettingsCard title="Band Members">
                        <div className="space-y-3">
                            {users.map(user => {
                                const isEditing = editingUserId === user.id;
                                const isCurrentUser = user.id === currentUser.id;
                                if (isEditing) {
                                    return <UserEditRow key={user.id} user={user} onSave={handleSaveUser} onCancel={() => setEditingUserId(null)} />;
                                } else {
                                    return (
                                        <div key={user.id} className="p-3 bg-gray-700/50 rounded-lg">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center"><div className="relative group"><img src={getUserAvatarUrl(user)} alt={user.name} className="h-10 w-10 rounded-full group-hover:opacity-50 transition-opacity" />{isCurrentUser && (<label className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"><EditIcon className="w-5 h-5 text-white" /><input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} /></label>)}</div><div className="ml-3"><p className="font-semibold text-sm">{user.name}</p><p className="text-xs text-gray-400">{user.primaryRole} &bull; {user.systemRole}</p></div></div>
                                                <div className="flex gap-2"><button onClick={() => setEditingUserId(user.id)} className="p-1 rounded-full hover:bg-gray-700"><EditIcon className="w-4 h-4 text-purple-400"/></button><button onClick={() => handleDeleteUser(user.id)} className="p-1 rounded-full hover:bg-gray-700"><TrashIcon className="w-4 h-4 text-red-500"/></button></div>
                                            </div>
                                        </div>
                                    );
                                }
                            })}
                        </div>
                        <button onClick={() => setIsInviteModalOpen(true)} className="w-full mt-4 flex items-center justify-center bg-purple-600/50 hover:bg-purple-600/80 text-white font-bold py-2 px-4 rounded-lg"><PlusIcon className="w-5 h-5 mr-2"/>Invite Member</button>
                    </SettingsCard>
                </div>
            </div>
            {isInviteModalOpen && <InviteMemberModal onClose={() => setIsInviteModalOpen(false)} onInvite={handleInviteMember} />}
            {isResetModalOpen && <ResetConfirmModal onClose={() => setIsResetModalOpen(false)} onConfirm={handleResetData} onDownloadBackup={handleExportData} />}
            {isImportModalOpen && <ImportOptionsModal onClose={() => setIsImportModalOpen(false)} onOverwrite={handleImportOverwrite} onImportNew={handleImportAsNew} />}
        </div>
    );
};