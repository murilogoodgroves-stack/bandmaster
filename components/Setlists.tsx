import React, { useState, useMemo, useRef } from 'react';
import Tesseract from 'tesseract.js';
import type { Setlist } from '../types';
import { PlusIcon, TrashIcon, EditIcon, SaveIcon } from './icons';

const fileToDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read the image file.'));
    reader.readAsDataURL(file);
});

const parseSetlistText = (rawText: string) => {
    return rawText
      .split(/\r?\n/)
      .map((line) => line.replace(/^\d+[\.)\-\s]*/, '').trim())
      .map((line) => line.replace(/\s{2,}/g, ' '))
      .filter((line) => line.length > 1)
      .filter((line) => !/^(setlist|set list|tour|show|performance|notes)$/i.test(line))
      .slice(0, 25);
};

interface SetlistsProps {
    activeBandId: string;
    setlists: Setlist[];
    setSetlists: React.Dispatch<React.SetStateAction<Setlist[]>>;
}

const SetlistCard: React.FC<{ 
    setlist: Setlist; 
    onDelete: (id: string) => void; 
    onUpdate: (id: string, name: string) => void; 
    onAddSong: (id: string, song: string) => void;
    onRemoveSong: (id: string, index: number) => void;
    onSavePhoto: (id: string, saved: Partial<Setlist>) => void;
}> = ({ setlist, onDelete, onUpdate, onAddSong, onRemoveSong, onSavePhoto }) => {
    const [isEditingName, setIsEditingName] = useState(false);
    const [editingName, setEditingName] = useState(setlist.name);
    const [newSong, setNewSong] = useState('');
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [ocrStatus, setOcrStatus] = useState('');

    const handleSaveName = () => {
        onUpdate(setlist.id, editingName);
        setIsEditingName(false);
    };

    const handleAddSong = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSong.trim()) return;
        onAddSong(setlist.id, newSong);
        setNewSong('');
    };

    const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        event.target.value = '';
        setOcrStatus('Reading setlist image...');

        try {
            const imageUrl = await fileToDataUrl(file);
            let extractedText = '';
            let extractedSongs: string[] = [];

            try {
                const { data } = await Tesseract.recognize(file, 'eng', {
                    logger: (progress) => {
                        if (progress.status === 'recognizing text') {
                            setOcrStatus(`Extracting setlist text... ${Math.round(progress.progress * 100)}%`);
                        }
                    },
                });
                extractedText = data.text || '';
                extractedSongs = parseSetlistText(extractedText);
            } catch (ocrError) {
                console.warn('Setlist OCR failed:', ocrError);
            }

            const savedSongs = extractedSongs.length ? extractedSongs : setlist.songs;
            onSavePhoto(setlist.id, {
                imageUrl,
                extractedText,
                sourceFileName: file.name,
                songs: savedSongs,
                notes: extractedSongs.length ? 'Setlist text was extracted from the uploaded image.' : 'Image uploaded and saved; text can be added manually.',
                updatedAt: new Date().toISOString(),
            });
            setOcrStatus(extractedSongs.length ? 'Setlist image processed and text saved.' : 'Image saved. Add or edit songs manually if needed.');
        } catch (error) {
            console.error('Setlist image upload failed:', error);
            setOcrStatus('The image could not be processed. Please try a clear photo.');
        }
    };

    return (
        <div className="bg-gray-800 p-5 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                {isEditingName ? (
                    <input 
                        type="text"
                        value={editingName}
                        onChange={e => setEditingName(e.target.value)}
                        onBlur={handleSaveName}
                        onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                        className="text-xl font-bold bg-gray-700 rounded p-1 -m-1 w-full"
                        autoFocus
                    />
                ) : (
                    <h3 className="text-xl font-bold truncate">{setlist.name}</h3>
                )}
                <div className="flex items-center flex-shrink-0 ml-2">
                    <button onClick={() => isEditingName ? handleSaveName() : setIsEditingName(true)} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
                        {isEditingName ? <SaveIcon className="h-5 w-5 text-green-500"/> : <EditIcon className="h-5 w-5 text-gray-400"/>}
                    </button>
                    <button onClick={() => onDelete(setlist.id)} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
                        <TrashIcon className="h-5 w-5 text-red-500"/>
                    </button>
                </div>
            </div>

            {setlist.imageUrl ? (
                <div className="mb-4 overflow-hidden rounded-lg border border-gray-700 bg-gray-900">
                    <img src={setlist.imageUrl} alt={setlist.name} className="max-h-48 w-full object-cover" />
                </div>
            ) : (
                <div className="mb-4 flex h-24 items-center justify-center rounded-lg border border-dashed border-gray-600 bg-gray-900 text-xs text-gray-400">
                    No set photo yet
                </div>
            )}

            <div className="mb-3 flex gap-2">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-3 rounded-md text-sm">
                    Upload Photo
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </div>
            {ocrStatus && <p className="mb-3 text-xs text-gray-400">{ocrStatus}</p>}

            <ol className="list-decimal list-inside space-y-2 mb-4 text-gray-300 min-h-[50px]">
                {setlist.songs.map((song, index) => (
                    <li key={index} className="flex justify-between items-center group">
                        <span className="truncate pr-2">{song}</span>
                        <button onClick={() => onRemoveSong(setlist.id, index)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-700 rounded">
                            <TrashIcon className="h-4 w-4 text-red-600"/>
                        </button>
                    </li>
                ))}
                {setlist.songs.length === 0 && <li className="list-none text-gray-500 italic text-sm">No songs added yet.</li>}
            </ol>
            <form onSubmit={handleAddSong} className="flex gap-2">
                <input type="text" placeholder="Add a song..." value={newSong} onChange={(e) => setNewSong(e.target.value)} className="flex-1 bg-gray-700 p-2 rounded-md text-sm"/>
                <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-1 px-3 rounded-md text-sm">Add</button>
            </form>
        </div>
    );
};

export const Setlists: React.FC<SetlistsProps> = ({ activeBandId, setlists: allSetlists, setSetlists: setAllSetlists }) => {
  const setlists = useMemo(() => allSetlists.filter(s => s.bandId === activeBandId), [allSetlists, activeBandId]);
  
  const [showForm, setShowForm] = useState(false);
  const [newSetlistName, setNewSetlistName] = useState('');

  const handleAddSetlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSetlistName) return;
    const setlist: Setlist = { id: Date.now().toString(), name: newSetlistName, songs: [], bandId: activeBandId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    setAllSetlists(prev => [...prev, setlist]);
    setNewSetlistName('');
    setShowForm(false);
  };
  
  const deleteSetlist = (id: string) => {
    setAllSetlists(prev => prev.filter(s => s.id !== id));
  };
  
  const updateSetlistName = (id: string, name: string) => {
      setAllSetlists(prev => prev.map(s => s.id === id ? { ...s, name, updatedAt: new Date().toISOString() } : s));
  };

  const saveSetlistPhoto = (id: string, saved: Partial<Setlist>) => {
      setAllSetlists(prev => prev.map(s => s.id === id ? { ...s, ...saved, updatedAt: new Date().toISOString() } : s));
  };
  
  const addSongToSetlist = (setlistId: string, songToAdd: string) => {
    setAllSetlists(prevSetlists => prevSetlists.map(s => 
      s.id === setlistId ? {...s, songs: [...s.songs, songToAdd], updatedAt: new Date().toISOString()} : s
    ));
  };
  
  const removeSong = (setlistId: string, songIndex: number) => {
    setAllSetlists(prevSetlists => prevSetlists.map(s => 
      s.id === setlistId ? {...s, songs: s.songs.filter((_, index) => index !== songIndex), updatedAt: new Date().toISOString()} : s
    ));
  };

  return (
    <div>
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold">Setlists</h1>
            <button onClick={() => setShowForm(!showForm)} className="flex items-center bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                <PlusIcon className="h-5 w-5 mr-2"/>
                {showForm ? 'Cancel' : 'New Setlist'}
            </button>
        </div>

        {showForm && (
            <div className="bg-gray-800 p-6 rounded-xl mb-8 shadow-lg">
                <form onSubmit={handleAddSetlist} className="flex gap-4">
                    <input type="text" placeholder="Setlist Name (e.g., Festival Set)" value={newSetlistName} onChange={e => setNewSetlistName(e.target.value)} className="flex-1 bg-gray-700 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" required/>
                    <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors">Create</button>
                </form>
            </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {setlists.map(setlist => (
                 <SetlistCard 
                    key={setlist.id} 
                    setlist={setlist} 
                    onDelete={deleteSetlist} 
                    onUpdate={updateSetlistName}
                    onAddSong={addSongToSetlist}
                    onRemoveSong={removeSong}
                    onSavePhoto={saveSetlistPhoto}
                 />
            ))}
        </div>
         {setlists.length === 0 && <p className="text-center text-gray-500 mt-8">No setlists created yet. Time to build a killer show!</p>}

    </div>
  );
};