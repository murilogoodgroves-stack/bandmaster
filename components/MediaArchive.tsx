import React, { useState, useMemo } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import type { MediaAsset } from '../types';
import { initialMediaAssets } from '../data/initialData';
import { PlusIcon, TrashIcon, EditIcon, SearchIcon, VideoIcon, ImageIcon, LinkIcon } from './icons';
import { Tip } from './Tip';

// Sub-component for the Add/Edit form, placed within a modal
const AssetFormModal: React.FC<{
  asset: MediaAsset | null;
  onSave: (asset: Omit<MediaAsset, 'id' | 'bandId'> & { id?: string }) => void;
  onClose: () => void;
}> = ({ asset, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: asset?.name || '',
    type: asset?.type || ('Photo' as 'Photo' | 'Video' | 'Link'),
    location: asset?.location || '',
    folderPath: asset?.folderPath || '',
    tags: asset?.tags.join(', ') || '',
    videoUrl: asset?.videoUrl || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: asset?.id,
      ...formData,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-4">{asset ? 'Edit' : 'Add'} Media Asset</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Asset Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-gray-700 p-3 rounded-lg" required />
          <div className="grid grid-cols-2 gap-4">
            <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as 'Photo' | 'Video' | 'Link' })} className="w-full bg-gray-700 p-3 rounded-lg">
              <option value="Photo">Photo</option>
              <option value="Video">Video</option>
              <option value="Link">Link</option>
            </select>
            <input type="text" placeholder="Storage Location (e.g., Google Drive)" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className="bg-gray-700 p-3 rounded-lg" />
          </div>
          {formData.type === 'Link' ? (
              <input type="url" placeholder="URL" value={formData.folderPath} onChange={e => setFormData({ ...formData, folderPath: e.target.value })} className="w-full bg-gray-700 p-3 rounded-lg" />
          ) : (
            <input type="text" placeholder="Folder Path" value={formData.folderPath} onChange={e => setFormData({ ...formData, folderPath: e.target.value })} className="w-full bg-gray-700 p-3 rounded-lg" />
          )}
          <input type="text" placeholder="Tags (comma-separated)" value={formData.tags} onChange={e => setFormData({ ...formData, tags: e.target.value })} className="w-full bg-gray-700 p-3 rounded-lg" />
          {formData.type === 'Video' && (
            <input type="url" placeholder="YouTube or Vimeo Embed URL" value={formData.videoUrl} onChange={e => setFormData({ ...formData, videoUrl: e.target.value })} className="w-full bg-gray-700 p-3 rounded-lg" />
          )}
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">Cancel</button>
            <button type="submit" className="bg-spotify-green hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg">Save Asset</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Sub-component for viewing asset details in a modal
const AssetDetailModal: React.FC<{ asset: MediaAsset; onClose: () => void; }> = ({ asset, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">{asset.name}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl">&times;</button>
        </div>
        <div className="overflow-y-auto">
            {asset.type === 'Video' && asset.videoUrl ? (
                <div className="aspect-video mb-4">
                    <iframe className="w-full h-full rounded-lg" src={asset.videoUrl} title={asset.name} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                </div>
            ) : asset.type === 'Photo' ? (
                <div className="w-full aspect-video bg-gray-700 rounded-lg flex items-center justify-center text-gray-500 mb-4">
                    <ImageIcon className="h-24 w-24" />
                    <p className="ml-4">Image Preview Placeholder</p>
                </div>
            ) : null}
            <div className="space-y-2 text-sm">
                <p><strong className="text-gray-400 w-24 inline-block">Type:</strong> {asset.type}</p>
                <p><strong className="text-gray-400 w-24 inline-block">Location:</strong> {asset.location}</p>
                <p><strong className="text-gray-400 w-24 inline-block">Path/URL:</strong> {asset.folderPath}</p>
                <div>
                    <strong className="text-gray-400 w-24 inline-block align-top">Tags:</strong>
                    <div className="inline-flex flex-wrap gap-2 max-w-md">
                        {asset.tags.map(tag => <span key={tag} className="bg-purple-600/50 text-purple-200 text-xs px-2 py-1 rounded-full">{tag}</span>)}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

interface MediaArchiveProps {
    activeBandId: string;
    media: MediaAsset[];
    setMedia: React.Dispatch<React.SetStateAction<MediaAsset[]>>;
}


// Main Component
export const MediaArchive: React.FC<MediaArchiveProps> = ({ activeBandId, media: allAssets, setMedia: setAssets }) => {
  const assets = useMemo(() => allAssets.filter(a => a.bandId === activeBandId), [allAssets, activeBandId]);

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Photo' | 'Video' | 'Link'>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<MediaAsset | null>(null);
  const [viewingAsset, setViewingAsset] = useState<MediaAsset | null>(null);
  const [showTip, setShowTip] = useState(true);

  const filteredAssets = useMemo(() => {
    return assets
      .filter(asset => typeFilter === 'All' || asset.type === typeFilter)
      .filter(asset =>
        asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
  }, [assets, searchQuery, typeFilter]);
  
  const handleSaveAsset = (assetData: Omit<MediaAsset, 'id' | 'bandId'> & { id?: string }) => {
    if (assetData.id) { // Editing existing asset
      setAssets(prev => prev.map(a => a.id === assetData.id ? { ...a, ...assetData, bandId: a.bandId } as MediaAsset : a));
    } else { // Adding new asset
      const newAsset: MediaAsset = {
        id: Date.now().toString(),
        name: assetData.name,
        type: assetData.type,
        location: assetData.location,
        folderPath: assetData.folderPath,
        tags: assetData.tags,
        videoUrl: assetData.videoUrl,
        bandId: activeBandId,
      };
      setAssets(prev => [...prev, newAsset]);
    }
    setIsModalOpen(false);
    setEditingAsset(null);
  };

  const handleEdit = (asset: MediaAsset) => {
    setEditingAsset(asset);
    setIsModalOpen(true);
  };
  
  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this asset?")) {
        setAssets(prev => prev.filter(a => a.id !== id));
    }
  };

  const assetTypeIcons = {
      Photo: <ImageIcon className="h-16 w-16 text-gray-500" />,
      Video: <VideoIcon className="h-16 w-16 text-gray-500" />,
      Link: <LinkIcon className="h-16 w-16 text-gray-500" />
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold">Media Archive</h1>
        <button onClick={() => { setEditingAsset(null); setIsModalOpen(true); }} className="flex items-center bg-spotify-green hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg">
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Asset
        </button>
      </div>

       {showTip && (
        <Tip onDismiss={() => setShowTip(false)}>
          Keep your archive organized with specific tags like "promo," "live," or "album art." It makes searching for the right file much faster! You can now also save important URLs using the 'Link' type.
        </Tip>
      )}

      {/* Search and Filter Controls */}
      <div className="bg-gray-800 p-4 rounded-xl mb-8 flex items-center gap-4">
        <div className="relative flex-grow">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or tag..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-gray-700 p-2 pl-10 rounded-lg"
          />
        </div>
        <div className="flex gap-2">
          {(['All', 'Photo', 'Video', 'Link'] as const).map(type => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-4 py-2 text-sm font-semibold rounded-lg ${typeFilter === type ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            >
              {type}s
            </button>
          ))}
        </div>
      </div>

      {/* Assets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredAssets.map(asset => (
          <div key={asset.id} className="bg-gray-800 rounded-lg shadow-lg flex flex-col">
            <div className="bg-gray-700 h-32 flex items-center justify-center rounded-t-lg">
                {assetTypeIcons[asset.type]}
            </div>
            <div className="p-4 flex flex-col flex-grow">
                <h3 className="font-bold text-white flex-grow">{asset.name}</h3>
                <div className="flex flex-wrap gap-1 my-2">
                    {asset.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-xs bg-gray-600 text-gray-300 px-2 py-0.5 rounded-full">{tag}</span>
                    ))}
                </div>
                 <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-700">
                    <button onClick={() => setViewingAsset(asset)} className="text-sm text-spotify-green font-semibold hover:underline">View</button>
                    <div className="flex gap-2">
                        <button onClick={() => handleEdit(asset)} className="p-2 hover:bg-gray-700 rounded-full"><EditIcon className="h-4 w-4 text-gray-400"/></button>
                        <button onClick={() => handleDelete(asset.id)} className="p-2 hover:bg-gray-700 rounded-full"><TrashIcon className="h-4 w-4 text-red-500"/></button>
                    </div>
                 </div>
            </div>
          </div>
        ))}
      </div>
      {filteredAssets.length === 0 && (
        <div className="text-center text-gray-500 py-16">
            <h3 className="text-xl font-semibold">No assets found.</h3>
            <p>Try adjusting your search or filters, or add a new asset to get started.</p>
        </div>
      )}

      {isModalOpen && <AssetFormModal asset={editingAsset} onSave={handleSaveAsset} onClose={() => setIsModalOpen(false)} />}
      {viewingAsset && <AssetDetailModal asset={viewingAsset} onClose={() => setViewingAsset(null)} />}
    </div>
  );
};