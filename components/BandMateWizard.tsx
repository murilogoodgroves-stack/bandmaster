import React, { useMemo, useState } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import type { BandMateWizardAnswerSet, BandProfile, User } from '../types';

interface BandMateWizardProps {
  activeBandId: string;
  bands: BandProfile[];
  currentUser: User | null;
}

const goalOptions = ['Release campaign', 'Press coverage', 'Booking + gigs', 'Radio + playlists', 'Music video / visuals', 'Funding & grants', 'Tour planning', 'Audience growth', 'Brand partnerships'];
const releaseOptions = ['Single', 'EP', 'Album', 'Music video', 'Tour launch', 'Merch launch', 'Monthly drop'];
const channelOptions = ['Spotify', 'Instagram', 'TikTok', 'YouTube', 'Bandcamp', 'Newsletter', 'Discord', 'Website', 'Apple Music'];
const useCaseOptions = ['Find labels', 'Find press', 'Find venues', 'Plan release budget', 'Create EPK', 'Manage campaigns', 'Track goals'];

const emptyWizardState = (bandName: string): BandMateWizardAnswerSet => ({
  bandName,
  artistName: '',
  genre: '',
  city: '',
  country: '',
  currentPhase: '',
  goals: [],
  releasePlans: [],
  channels: [],
  useCases: [],
  teamSize: '',
  fundingNeeds: '',
  bookingFocus: '',
  nextMilestone: '',
  notes: '',
  updatedAt: new Date().toISOString(),
});

const toggleItem = <T,>(items: T[], value: T): T[] => items.includes(value) ? items.filter((item) => item !== value) : [...items, value];

export const BandMateWizard: React.FC<BandMateWizardProps> = ({ activeBandId, bands, currentUser }) => {
  const activeBand = bands.find((band) => band.id === activeBandId) || bands[0] || null;
  const [answers, setAnswers] = useLocalStorage<BandMateWizardAnswerSet>(`bandmateWizard_${activeBandId}`, emptyWizardState(activeBand?.name || 'My Band'));
  const [isSaving, setIsSaving] = useState(false);

  const progress = useMemo(() => {
    const fields = [
      answers.artistName,
      answers.genre,
      answers.city,
      answers.country,
      answers.currentPhase,
      answers.teamSize,
      answers.fundingNeeds,
      answers.bookingFocus,
      answers.nextMilestone,
      answers.notes,
      ...answers.goals,
      ...answers.releasePlans,
      ...answers.channels,
      ...answers.useCases,
    ];
    const filled = fields.filter((value) => typeof value === 'string' ? value.trim().length > 0 : Boolean(value)).length;
    const total = 18;
    return Math.min(100, Math.max(0, Math.round((filled / total) * 100)));
  }, [answers]);

  const guidanceCards = useMemo(() => {
    const cards: Array<{ title: string; description: string; page: string; actionLabel: string; status: string; progress: number }> = [];

    if (answers.goals.includes('Release campaign') || answers.releasePlans.length > 0) {
      cards.push({
        title: 'Release roadmap',
        description: 'Map release milestones, production dependencies, and public launch tasks.',
        page: 'projects',
        actionLabel: 'Open Projects',
        status: answers.nextMilestone ? 'In motion' : 'Next up',
        progress: Math.min(100, 35 + answers.releasePlans.length * 15 + (answers.nextMilestone ? 15 : 0)),
      });
    }

    if (answers.goals.includes('Press coverage') || answers.useCases.includes('Find press')) {
      cards.push({
        title: 'Press pipeline',
        description: 'Keep outreach, contacts, and media assets organized before you pitch.',
        page: 'press',
        actionLabel: 'Open Press Outreach',
        status: answers.channels.includes('Website') || answers.channels.includes('Instagram') ? 'Ready' : 'Needs setup',
        progress: Math.min(100, 30 + answers.channels.length * 8 + (answers.notes ? 10 : 0)),
      });
    }

    if (answers.goals.includes('Booking + gigs') || answers.useCases.includes('Find venues')) {
      cards.push({
        title: 'Gig and venue plan',
        description: 'Track dates, venues, routing, and booking momentum across the live calendar.',
        page: 'gigs',
        actionLabel: 'Open Gigs',
        status: answers.bookingFocus ? 'Focused' : 'Planning',
        progress: Math.min(100, 25 + (answers.bookingFocus ? 25 : 0) + (answers.city ? 10 : 0)),
      });
    }

    if (answers.goals.includes('Radio + playlists') || answers.useCases.includes('Manage campaigns')) {
      cards.push({
        title: 'Campaigns & outreach',
        description: 'Ship newsletters, send follow-ups, and keep radio and audience outreach moving.',
        page: 'campaigns',
        actionLabel: 'Open Campaigns',
        status: answers.channels.includes('Newsletter') ? 'Active' : 'Drafting',
        progress: Math.min(100, 20 + answers.channels.length * 10 + (answers.teamSize ? 10 : 0)),
      });
    }

    if (answers.goals.includes('Funding & grants') || answers.useCases.includes('Track goals')) {
      cards.push({
        title: 'Funding & goals',
        description: 'Tie your grants, milestones, and financial checkpoints to the bigger plan.',
        page: 'funding',
        actionLabel: 'Open Funding',
        status: answers.fundingNeeds ? 'Prioritized' : 'Review',
        progress: Math.min(100, 25 + (answers.fundingNeeds ? 30 : 0) + (answers.goals.includes('Funding & grants') ? 20 : 0)),
      });
    }

    if (answers.useCases.includes('Create EPK')) {
      cards.push({
        title: 'EPK & media kit',
        description: 'Prepare a clean public story with visuals, bio, and release assets for the right audiences.',
        page: 'epk',
        actionLabel: 'Open EPK',
        status: answers.artistName ? 'Ready to build' : 'Needs setup',
        progress: Math.min(100, 20 + (answers.artistName ? 20 : 0) + (answers.genre ? 15 : 0)),
      });
    }

    if (answers.channels.length > 0 || answers.goals.length > 0) {
      cards.push({
        title: 'Links database',
        description: 'Keep your essential URLs, profiles, travel pages, and references close and searchable.',
        page: 'links',
        actionLabel: 'Open Links',
        status: 'Live',
        progress: Math.min(100, 50 + Math.min(answers.channels.length * 8, 30)),
      });
    }

    if (cards.length === 0) {
      cards.push({
        title: 'Start with your core plan',
        description: 'Choose your main goals and channels; BandMate will then tailor the right sections and next actions for you.',
        page: 'wizard',
        actionLabel: 'Complete setup',
        status: 'Start here',
        progress: 15,
      });
    }

    return cards;
  }, [answers]);

  const handleField = (field: keyof BandMateWizardAnswerSet, value: string | string[]) => {
    setAnswers((prev) => ({
      ...prev,
      [field]: value,
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setAnswers((prev) => ({ ...prev, updatedAt: new Date().toISOString() }));
      setIsSaving(false);
    }, 200);
  };

  const handleReset = () => {
    setAnswers(emptyWizardState(activeBand?.name || 'My Band'));
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">BandMate Wizard</h1>
          <p className="text-gray-400 mt-2">This questionnaire learns what matters most to your project and keeps tailoring the app around your goals.</p>
        </div>
        <div className="rounded-full border border-brand-accent/30 bg-brand-accent/10 px-4 py-2 text-sm text-brand-accent">
          {progress}% complete
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-300">Progress</span>
          <span className="text-sm text-brand-accent">{progress}%</span>
        </div>
        <div className="mt-3 h-2 rounded-full bg-gray-700">
          <div className="h-2 rounded-full bg-brand-accent transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.7fr] gap-8">
        <div className="space-y-6 bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Band name</label>
              <input value={answers.bandName || activeBand?.name || ''} onChange={(e) => handleField('bandName', e.target.value)} className="w-full bg-gray-700 p-3 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Artist / project name</label>
              <input value={answers.artistName} onChange={(e) => handleField('artistName', e.target.value)} placeholder="Solo project / duo / artist" className="w-full bg-gray-700 p-3 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Genre</label>
              <input value={answers.genre} onChange={(e) => handleField('genre', e.target.value)} placeholder="Indie rock / electronic / folk" className="w-full bg-gray-700 p-3 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">City</label>
              <input value={answers.city} onChange={(e) => handleField('city', e.target.value)} placeholder="Berlin" className="w-full bg-gray-700 p-3 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Country</label>
              <input value={answers.country} onChange={(e) => handleField('country', e.target.value)} placeholder="Germany" className="w-full bg-gray-700 p-3 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Current phase</label>
              <input value={answers.currentPhase} onChange={(e) => handleField('currentPhase', e.target.value)} placeholder="Writing / recording / booking / touring" className="w-full bg-gray-700 p-3 rounded-lg" />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Main goals</label>
            <div className="flex flex-wrap gap-2">
              {goalOptions.map((option) => {
                const active = answers.goals.includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleField('goals', toggleItem(answers.goals, option))}
                    className={`rounded-full px-3 py-2 text-sm border ${active ? 'bg-brand-accent text-white border-brand-accent' : 'bg-gray-700 text-gray-200 border-gray-600'}`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">What are you building next?</label>
            <div className="flex flex-wrap gap-2">
              {releaseOptions.map((option) => {
                const active = answers.releasePlans.includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleField('releasePlans', toggleItem(answers.releasePlans, option))}
                    className={`rounded-full px-3 py-2 text-sm border ${active ? 'bg-green-600 text-white border-green-600' : 'bg-gray-700 text-gray-200 border-gray-600'}`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Core channels</label>
            <div className="flex flex-wrap gap-2">
              {channelOptions.map((option) => {
                const active = answers.channels.includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleField('channels', toggleItem(answers.channels, option))}
                    className={`rounded-full px-3 py-2 text-sm border ${active ? 'bg-purple-600 text-white border-purple-600' : 'bg-gray-700 text-gray-200 border-gray-600'}`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">What do you want BandMate to help with?</label>
            <div className="flex flex-wrap gap-2">
              {useCaseOptions.map((option) => {
                const active = answers.useCases.includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleField('useCases', toggleItem(answers.useCases, option))}
                    className={`rounded-full px-3 py-2 text-sm border ${active ? 'bg-yellow-600 text-white border-yellow-600' : 'bg-gray-700 text-gray-200 border-gray-600'}`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Team size</label>
              <input value={answers.teamSize} onChange={(e) => handleField('teamSize', e.target.value)} placeholder="Solo / 2-4 / with manager" className="w-full bg-gray-700 p-3 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Funding or support needs</label>
              <input value={answers.fundingNeeds} onChange={(e) => handleField('fundingNeeds', e.target.value)} placeholder="Grants, sponsorships, or support" className="w-full bg-gray-700 p-3 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Booking focus</label>
              <input value={answers.bookingFocus} onChange={(e) => handleField('bookingFocus', e.target.value)} placeholder="Festivals / clubs / support slots / touring" className="w-full bg-gray-700 p-3 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Next milestone</label>
              <input value={answers.nextMilestone} onChange={(e) => handleField('nextMilestone', e.target.value)} placeholder="Release single / secure bookings / finish video" className="w-full bg-gray-700 p-3 rounded-lg" />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Notes</label>
            <textarea value={answers.notes} onChange={(e) => handleField('notes', e.target.value)} rows={4} placeholder="Add details about your sound, goals, current challenges, team structure, or internal priorities." className="w-full bg-gray-700 p-3 rounded-lg resize-none" />
          </div>

          <div className="flex gap-3">
            <button onClick={handleSave} className="bg-brand-accent hover:bg-brand-accent-dark text-white font-bold py-3 px-5 rounded-lg">
              {isSaving ? 'Saving...' : 'Save progress'}
            </button>
            <button onClick={handleReset} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-5 rounded-lg">
              Reset
            </button>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">System guidance</h2>
              <span className="rounded-full bg-brand-accent/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-brand-accent">
                {guidanceCards.length} paths
              </span>
            </div>

            <div className="space-y-4">
              {guidanceCards.map((item) => (
                <div key={item.title} className="rounded-xl border border-gray-700 bg-gradient-to-br from-gray-700/40 to-gray-800 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-brand-accent">{item.status}</p>
                      <h3 className="mt-1 text-lg font-bold text-white">{item.title}</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        window.location.hash = item.page;
                      }}
                      className="rounded-lg border border-brand-accent/40 bg-brand-accent/10 px-2 py-1 text-xs font-medium text-brand-accent hover:bg-brand-accent/20"
                    >
                      {item.actionLabel}
                    </button>
                  </div>

                  <p className="mt-3 text-sm text-gray-300">{item.description}</p>

                  <div className="mt-4">
                    <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-gray-400">
                      <span>Progress</span>
                      <span>{item.progress}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-700">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-accent to-purple-500 transition-all"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-bold mb-3">Session summary</h2>
            <p className="text-sm text-gray-400">Last updated: {answers.updatedAt ? new Date(answers.updatedAt).toLocaleString() : 'Not yet saved'}</p>
            <div className="mt-4 space-y-2 text-sm text-gray-300">
              <p><span className="text-brand-accent">Artist:</span> {answers.artistName || 'Not set yet'}</p>
              <p><span className="text-brand-accent">Focus:</span> {answers.currentPhase || 'Not set yet'}</p>
              <p><span className="text-brand-accent">Primary goals:</span> {answers.goals.length ? answers.goals.join(', ') : 'Add a few priorities'}</p>
              <p><span className="text-brand-accent">User:</span> {currentUser?.name || 'No user selected'}</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
