import React, { useState, useMemo } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, SearchIcon, XIcon, BookOpenIcon } from './icons';

interface HelpTopic {
  id: string;
  icon: string;
  title: string;
  category: string;
  description: string;
  steps: string[];
  tips: string[];
}

const HELP_TOPICS: HelpTopic[] = [
  {
    id: 'dashboard',
    icon: '📊',
    title: 'Dashboard - Your Control Center',
    category: 'Getting Started',
    description: 'The dashboard is the first screen you see. It gives you a quick overview of what is happening with your music.',
    steps: [
      'Open it after login',
      'See upcoming shows, releases, and tasks',
      'Click any card to drill deeper',
      'Use it to monitor overall progress',
    ],
    tips: [
      'The dashboard updates in real time',
      'You can customize what appears in Settings',
      'All numbers are interactive — click them!',
    ]
  },
  {
    id: 'releases',
    icon: '💿',
    title: 'Releases - Planning Your Launch',
    category: 'Music',
    description: 'Manage singles, EPs, and album launches with a complete pre and post-release checklist.',
    steps: [
      'Click "Releases" in the sidebar',
      'Click "Plan New Release" to create a release',
      'Set the release date (ideally 4-6 weeks ahead)',
      'Fill out the checklist with specific tasks',
      'Assign tasks to team members',
      'Track progress with the green status bar',
    ],
    tips: [
      'Use the checkbox on the left to mark tasks as complete',
      'AI can generate a launch plan for you',
      'You can upload cover art here',
      'Tasks appear in your calendar so nothing gets missed',
    ]
  },
  {
    id: 'campaigns',
    icon: '📧',
    title: 'Campaigns - Sending Professional Emails',
    category: 'Contacts',
    description: 'Create email campaigns for press, radio, labels, and fans. AI can generate personalized content if needed.',
    steps: [
      'Click "Campaigns" in the sidebar',
      'Click "New Campaign"',
      'Step 1: name the campaign and select the type',
      'Step 2: choose recipients from your contact list',
      'Step 3: write the email or let AI draft it',
      'Step 4: review and send now or schedule later',
    ],
    tips: [
      'Use "Import from EPK" to generate emails based on your band',
      'You can schedule automatic follow-ups if there is no response',
      'Different tones are available: Professional, Casual, Enthusiastic',
      'Placeholders like {{name}} and {{outlet}} work as expected',
    ]
  },
  {
    id: 'tours',
    icon: '🚌',
    title: 'Tours - Organizing Your Shows',
    category: 'Shows',
    description: 'Create tours with multiple dates, venues, and time slots. Integrate setlists and share details with the band.',
    steps: [
      'Click "Tours" in the sidebar',
      'Click "New Tour" to create a new tour',
      'Choose start and end dates',
      'Add shows using "Add Show"',
      'For each show, add venue, date, and time',
      'Create time slots and assign a setlist',
    ],
    tips: [
      'You can import a tour plan that already exists',
      'Venues appear automatically if already saved',
      'AI can suggest nearby places based on previous patterns',
      'Sync with your calendar to avoid missing dates',
    ]
  },
  {
    id: 'press',
    icon: '📰',
    title: 'Press Outreach - Connecting with Journalists',
    category: 'Contacts',
    description: 'Find journalists who cover artists similar to you. Use Sound Match to discover opportunities automatically.',
    steps: [
      'Click "Press" in the sidebar',
      'Paste a similar artist in the "Find New Contacts" field',
      'AI will find journalists who cover that artist',
      'Click "Add" to save them to your list',
      'Use "Add Contact" to add one manually',
      'Organize contacts by tier (A, B, C)',
    ],
    tips: [
      'Sound Match finds journalists who truly match your style',
      'You can import a CSV with your contacts',
      'Use campaigns to send pitches to multiple journalists',
      'Import contacts from your EPK automatically',
    ]
  },
  {
    id: 'soundmatch',
    icon: '🎯',
    title: 'Sound Match - AI Finds Opportunities',
    category: 'AI & Intelligence',
    description: 'Paste your Spotify URL. AI analyzes your sound and finds relevant press and radio opportunities based on your style.',
    steps: [
      'Add your Spotify artist URL',
      'Click "Analyze My Sound"',
      'Review the generated analysis (genres, moods, similar artists)',
      'Click "Find Opportunities"',
      'AI suggests journalists and DJs who match your sound',
      'Save contacts directly to Press or Radio',
    ],
    tips: [
      'Sound Match is better than generic genre searches',
      'It is based on real data from similar artists',
      'You can do this whenever you release something new',
      'Discoveries are saved automatically',
    ]
  },
  {
    id: 'calendar',
    icon: '📅',
    title: 'Calendar - Everything in One Place',
    category: 'Scheduling',
    description: 'Your unified calendar shows shows, releases, deadlines, tasks, and reminders in one place.',
    steps: [
      'Click "Calendar" in the sidebar',
      'Choose between weekly, monthly, or yearly views',
      'See event types such as releases, tours, tasks, and funding',
      'Click an event to view more details',
      'Use the + button to add manual events',
    ],
    tips: [
      'Reminders appear automatically 7, 3, and 1 day before',
      'Use the arrows to navigate quickly',
      'Event color indicates the type (pink = gig, blue = studio, etc.)',
      'Important materials appear with a paperclip icon',
    ]
  },
  {
    id: 'financials',
    icon: '💰',
    title: 'Financials - Managing Your Money',
    category: 'Business',
    description: 'Track income, expenses, and profit splits between band members.',
    steps: [
      'Click "Financials" in the sidebar',
      'View income types (merch, shows, streams, etc.)',
      'Add transactions manually',
      'Set how to split money between members',
      'Review monthly revenue trends',
    ],
    tips: [
      'Profit splits are band-based, not individual',
      'You can sync with banks later (future feature)',
      'All numbers update in real time',
      'Export reports for your accountant',
    ]
  },
  {
    id: 'taskmanager',
    icon: '✅',
    title: 'Task Manager - Organize Your Tasks',
    category: 'Productivity',
    description: 'A simple Kanban workflow: To Do → In Progress → Review → Done. Perfect for coordinating with your team.',
    steps: [
      'Click "Task Manager" in the sidebar',
      'Click "+ New Task" to create a task',
      'Set priority, deadline, and assignee',
      'Tasks appear in columns by status',
      'Click "Start" to move it to In Progress',
      'Click "Done" when finished',
    ],
    tips: [
      'Release tasks appear here automatically',
      'Late tasks appear with a red ⚠️ indicator',
      'Filter by person or priority',
      'AI can suggest the next tasks',
    ]
  },
  {
    id: 'productions',
    icon: '🎚️',
    title: 'Production - Organizing Your Tracks',
    category: 'Creation',
    description: 'Track songs in production, recording, mixing, and mastering. See progress for each track.',
    steps: [
      'Click "Production" in the sidebar',
      'Click "+ New Song" to add a track',
      'Set composer, genre, and inspirations',
      'Update status as it evolves (Demo → Studio → Mix → Master)',
      'Add notes for sessions and feedback',
    ],
    tips: [
      'Each song has its own timeline',
      'You can add Drive/Dropbox links for demos',
      'Share timelines with your producer or engineer',
      'Keep a full history of how each track evolved',
    ]
  },
  {
    id: 'funding',
    icon: '🎁',
    title: 'Funding - Finding Financial Support',
    category: 'Opportunities',
    description: 'Find grants, fellowships, prizes, and crowdfunding opportunities to support your music projects.',
    steps: [
      'Click "Funding" in the sidebar',
      'Search by keyword (for example, "music" or "arts")',
      'Review deadlines and requirements for each opportunity',
      'Save ones that fit your goals',
      'Add reminders in the calendar 6+ weeks before each deadline',
    ],
    tips: [
      'Always look ahead and plan for deadlines early',
      'Save opportunities even if you are not launching right away',
      'AI can help create a strong funding application draft',
      'You can add funds manually as well',
    ]
  },
  {
    id: 'epk',
    icon: '🎭',
    title: 'EPK - Your Digital Press Kit',
    category: 'Professional',
    description: 'Create a professional press kit you can share with media, venues, festivals, and labels.',
    steps: [
      'Click "EPK" in the sidebar',
      'Add your main cover photo',
      'Write your bio (AI can help)',
      'Attach your latest release',
      'Highlight your upcoming shows',
      'Share the link with contacts',
    ],
    tips: [
      'EPK makes you look professional',
      'Update it whenever there is important news',
      'All links are traceable (you can see who clicked)',
      'It works well on mobile for venue outreach',
    ]
  },
  {
    id: 'merch',
    icon: '👕',
    title: 'Merchandise - Selling Your Products',
    category: 'Business',
    description: 'Create a product catalog (shirts, vinyl, CDs, posters, etc.) and track sales and profit per show.',
    steps: [
      'Click "Merchandise" in the sidebar',
      'Click "Add Item" for a new product',
      'Set the type (Shirt, CD, Vinyl, Poster)',
      'Add variations (sizes, colors)',
      'Assign stock per variant',
      'At the show, click "+ Sale" to log a sale',
    ],
    tips: [
      'Merch is an important revenue stream',
      'Track stock to avoid selling what you do not have',
      'You can offer discounts on certain quantities',
      'It generates reports showing which products sell best',
    ]
  },
  {
    id: 'settings',
    icon: '⚙️',
    title: 'Settings - Your Account Configuration',
    category: 'System',
    description: 'Configure band info, members, API integrations, and data export.',
    steps: [
      'Click "Settings" in the sidebar',
      'Update band name and genre',
      'Add team members (email + role)',
      'Set pricing and profit splits',
      'Review API usage limits',
      'Export your data whenever needed',
    ],
    tips: [
      'You can reset all data (be careful!)',
      'Members receive an invite email',
      'API monitoring shows how much AI usage has been consumed',
      'Exported data is in JSON and easy to re-import later',
    ]
  },
  {
    id: 'radio',
    icon: '📻',
    title: 'Radio Outreach - Reaching DJs',
    category: 'Contacts',
    description: 'Find radio stations, programs, and DJs playing your style. Send music for review.',
    steps: [
      'Click "Radio" in the sidebar',
      'Search by genre (indie rock, electronic, etc.)',
      'Review station, country, and program description',
      'Click "Save" to add it to the list',
      'Use Campaigns to send your music',
    ],
    tips: [
      'Community radio is easier to start with',
      'Research before sending',
      'Some DJs also have socials — send to everyone',
      'Radio can create strong buzz when it works',
    ]
  },
  {
    id: 'collaborators',
    icon: '👥',
    title: 'Collaborators - Your Team',
    category: 'Organization',
    description: 'Register producers, engineers, photographers, and other collaborators with contact and notes.',
    steps: [
      'Click "Collaborators" in the sidebar',
      'Click "Add Collaborator"',
      'Add name, role (Producer, Engineer, etc.)',
      'Store email and notes (portfolio, hourly rate, etc.)',
      'Filter by professional type',
    ],
    tips: [
      'This is where you store your preferred tech and studio contacts',
      'Add portfolio or Instagram links',
      'You can rate and leave feedback',
      'Use it as a reference when you need help',
    ]
  },
  {
    id: 'search-cache',
    icon: '💾',
    title: 'Searches Save Automatically',
    category: 'Quick Tip',
    description: 'When you do a search in Press, Radio, or Labels, results are saved automatically.',
    steps: [
      'Run any search',
      'Leave the page and come back later',
      'Your last 20 results are there',
      'This also works if you close the browser',
    ],
    tips: [
      'Never lose your search results again',
      'It works on mobile too',
      'Data is stored locally in your browser',
    ]
  },
];

interface HelpCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpCenter: React.FC<HelpCenterProps> = ({ isOpen, onClose }) => {
  const [selectedTopic, setSelectedTopic] = useState<HelpTopic | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const categories = useMemo(() => {
    return Array.from(new Set(HELP_TOPICS.map(t => t.category))).sort();
  }, []);

  const filteredTopics = useMemo(() => {
    return HELP_TOPICS.filter(topic => {
      const matchesSearch = topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           topic.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || topic.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, categoryFilter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex z-50">
      {selectedTopic && (
        <div className="w-full max-w-2xl bg-gray-800 overflow-y-auto">
          <div className="p-6 border-b border-gray-700">
            <button
              onClick={() => setSelectedTopic(null)}
              className="flex items-center gap-2 text-purple-400 hover:text-purple-300 mb-4"
            >
              <ChevronLeftIcon className="w-5 h-5" />
              Back
            </button>
            <h2 className="text-3xl font-bold text-white">
              {selectedTopic.icon} {selectedTopic.title}
            </h2>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <p className="text-gray-300">{selectedTopic.description}</p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">How to do it:</h3>
              <ol className="space-y-2">
                {selectedTopic.steps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-gray-300">
                    <span className="text-purple-400 font-bold">{i + 1}.</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            {selectedTopic.tips.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-white mb-3">💡 Useful Tips:</h3>
                <ul className="space-y-2">
                  {selectedTopic.tips.map((tip, i) => (
                    <li key={i} className="flex gap-3 text-gray-300">
                      <span className="text-yellow-400">✦</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {!selectedTopic && (
        <div className="w-full bg-gray-800 flex flex-col">
          <div className="p-6 border-b border-gray-700 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                <BookOpenIcon className="w-8 h-8 text-purple-400" />
                Help Center
              </h1>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-700 rounded-lg transition"
              >
                <XIcon className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search for a topic..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="px-6 pt-4 flex-shrink-0 overflow-x-auto">
            <div className="flex gap-2 pb-4">
              <button
                onClick={() => setCategoryFilter('all')}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
                  categoryFilter === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                All
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
                    categoryFilter === cat
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <div className="grid gap-4 mt-4">
              {filteredTopics.map(topic => (
                <button
                  key={topic.id}
                  onClick={() => setSelectedTopic(topic)}
                  className="bg-gray-700 hover:bg-gray-600 rounded-lg p-4 text-left transition border border-gray-600 hover:border-purple-500"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{topic.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-bold text-white">{topic.title}</h3>
                      <p className="text-sm text-gray-400 mt-1">{topic.description}</p>
                      <p className="text-xs text-purple-400 mt-2">{topic.category}</p>
                    </div>
                    <ChevronRightIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  </div>
                </button>
              ))}

              {filteredTopics.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-400">No topics found. Try another search.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
