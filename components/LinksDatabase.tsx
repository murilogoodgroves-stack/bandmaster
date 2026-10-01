import React, { useMemo, useState } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import type { BandProfile, SavedLink } from '../types';
import { CopyIcon, DownloadIcon, ExternalLinkIcon, PlusIcon, SaveIcon, SearchIcon, TrashIcon } from './icons';

interface LinksDatabaseProps {
  activeBandId: string;
  bands: BandProfile[];
  searchCache?: Array<{ searchTerm: string; source: string; results: any[]; timestamp: number }>;
}

const defaultDraft = {
  title: '',
  url: '',
  description: '',
  category: 'General',
};

export const LinksDatabase: React.FC<LinksDatabaseProps> = ({ activeBandId, bands, searchCache = [] }) => {
  const [links, setLinks] = useLocalStorage<SavedLink[]>(`linksDatabase_${activeBandId}`, []);
  const [draft, setDraft] = useState(defaultDraft);
  const [searchQuery, setSearchQuery] = useState('');
  const bandName = useMemo(() => bands.find((b) => b.id === activeBandId)?.name || 'Band', [bands, activeBandId]);

  const handleAddLink = () => {
    const trimmedUrl = draft.url.trim();
    if (!draft.title.trim() || !trimmedUrl || !draft.description.trim()) {
      return;
    }

    const safeUrl = /^https?:\/\//i.test(trimmedUrl) ? trimmedUrl : `https://${trimmedUrl}`;
    setLinks((prev) => [{
      id: `link-${Date.now()}`,
      bandId: activeBandId,
      title: draft.title.trim(),
      url: safeUrl,
      description: draft.description.trim(),
      category: draft.category,
      createdAt: new Date().toISOString(),
    }, ...prev]);
    setDraft(defaultDraft);
  };

  const handleDeleteLink = (id: string) => {
    setLinks((prev) => prev.filter((link) => link.id !== id));
  };

  const handleCopyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
    } catch (error) {
      console.warn('Copy failed', error);
    }
  };

  const handleExportLinks = () => {
    const data = JSON.stringify(links, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${bandName.toLowerCase().replace(/\s+/g, '-')}-links.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const filteredLinks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return links;
    return links.filter((link) => {
      return [link.title, link.description, link.category, link.url].some((value) =>
        value.toLowerCase().includes(query)
      );
    });
  }, [links, searchQuery]);

  const groupedLinks = useMemo(() => {
    return filteredLinks.reduce<Record<string, SavedLink[]>>((acc, link) => {
      const category = link.category || 'General';
      acc[category] = acc[category] ? [...acc[category], link] : [link];
      return acc;
    }, {});
  }, [filteredLinks]);

  const recentSearches = useMemo(() => searchCache.slice(0, 6), [searchCache]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">Links Database</h1>
          <p className="text-gray-400 mt-2">A persistent home for the URLs, profiles, and references your team relies on most.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-full border border-brand-accent/30 bg-brand-accent/10 px-4 py-2 text-sm text-brand-accent">
            {links.length} saved links for {bandName}
          </div>
          <button
            type="button"
            onClick={handleExportLinks}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm font-medium text-gray-200 hover:border-brand-accent hover:text-white"
          >
            <DownloadIcon className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-8">
        <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-5">
            <PlusIcon className="w-5 h-5 text-brand-accent" />
            <h2 className="text-xl font-bold">Add a link</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Title</label>
              <input
                value={draft.title}
                onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Spotify, Press kit, Venue, Distributor..."
                className="w-full bg-gray-700 p-3 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">URL</label>
              <input
                value={draft.url}
                onChange={(e) => setDraft((prev) => ({ ...prev, url: e.target.value }))}
                placeholder="https://example.com"
                className="w-full bg-gray-700 p-3 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Category</label>
              <select
                value={draft.category}
                onChange={(e) => setDraft((prev) => ({ ...prev, category: e.target.value }))}
                className="w-full bg-gray-700 p-3 rounded-lg"
              >
                <option>General</option>
                <option>Dashboard</option>
                <option>Projects</option>
                <option>Releases</option>
                <option>Press</option>
                <option>Marketing</option>
                <option>Booking</option>
                <option>Funding</option>
                <option>Finance</option>
                <option>Social</option>
                <option>Streaming</option>
                <option>Resources</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Why it matters</label>
              <textarea
                value={draft.description}
                onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
                rows={4}
                placeholder="Example: This is the main booking URL for festivals and gig inquiries."
                className="w-full bg-gray-700 p-3 rounded-lg resize-none"
              />
            </div>
            <button onClick={handleAddLink} className="flex items-center bg-brand-accent hover:bg-brand-accent-dark text-white font-bold py-3 px-4 rounded-lg">
              <SaveIcon className="w-4 h-4 mr-2" />
              Save link
            </button>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-bold mb-4">Saved research memory</h2>
          {recentSearches.length === 0 ? (
            <p className="text-gray-400">No saved AI search history yet. Run a search in Label Reachout, Press Outreach, Funding, or Festival tools and it will appear here.</p>
          ) : (
            <div className="space-y-3">
              {recentSearches.map((item, index) => (
                <div key={`${item.source}-${index}`} className="border border-gray-700 rounded-lg p-3 bg-gray-700/35">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs uppercase tracking-wide text-brand-accent">{item.source}</span>
                    <span className="text-[10px] text-gray-400">{new Date(item.timestamp).toLocaleDateString()}</span>
                  </div>
                  <p className="font-semibold mt-2">{item.searchTerm || 'General search'}</p>
                  <p className="text-sm text-gray-400 mt-1">{item.results.length} result(s) saved and available for future reference.</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="border-b border-gray-700 px-6 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-xl font-bold">Saved links</h2>
          <div className="relative w-full max-w-sm">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search links..."
              className="w-full rounded-lg border border-gray-700 bg-gray-700 px-10 py-2 text-sm text-white placeholder:text-gray-400"
            />
          </div>
        </div>

        {filteredLinks.length === 0 ? (
          <p className="text-center text-gray-500 py-12">No matches in this band’s links database yet.</p>
        ) : (
          <div className="space-y-6 p-6">
            {Object.entries(groupedLinks).map(([category, categoryLinks]) => (
              <div key={category} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-brand-accent">{category}</h3>
                  <span className="text-xs text-gray-400">{categoryLinks.length} links</span>
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {categoryLinks.map((link) => (
                    <div key={link.id} className="rounded-xl border border-gray-700 bg-gray-700/35 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-bold text-white">{link.title}</h3>
                        </div>
                        <button onClick={() => handleDeleteLink(link.id)} className="p-2 rounded-lg hover:bg-red-900/35 text-red-400">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>

                      <p className="text-sm text-gray-400 mt-2">{link.description}</p>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center text-sm text-brand-accent hover:text-brand-accent-dark"
                          >
                            <ExternalLinkIcon className="w-4 h-4 mr-1" />
                            Open
                          </a>
                          <button
                            type="button"
                            onClick={() => handleCopyLink(link.url)}
                            className="inline-flex items-center text-sm text-gray-300 hover:text-white"
                          >
                            <CopyIcon className="w-4 h-4 mr-1" />
                            Copy
                          </button>
                        </div>
                        <span className="text-[10px] text-gray-500">{new Date(link.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
