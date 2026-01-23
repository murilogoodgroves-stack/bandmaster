
import React, { useState, useMemo } from 'react';
import type { Release, MediaAsset, PublishedArticle, Tour, BandProfile } from '../types';
import { initialMediaAssets } from '../data/initialData';
import { EditIcon, LinkIcon, MusicIcon, VideoIcon, ImageIcon, CalendarIcon, PressIcon, InfoIcon } from './icons';

const EPKSection: React.FC<{ icon: React.ReactNode, title: string, children: React.ReactNode }> = ({ icon, title, children }) => (
    <section className="mb-10">
        <h2 className="flex items-center text-2xl font-bold text-spotify-green mb-4 border-b-2 border-spotify-green/30 pb-2">
            {icon}
            <span className="ml-3">{title}</span>
        </h2>
        {children}
    </section>
);


export const EPK: React.FC<{ 
    bands: BandProfile[], 
    activeBandId: string,
    releases: Release[],
    media: MediaAsset[],
    articles: PublishedArticle[],
    tours: Tour[],
    bandBio: string,
    setBandBio: React.Dispatch<React.SetStateAction<string>>,
    epkPhotoId: string,
    setEpkPhotoId: React.Dispatch<React.SetStateAction<string>>,
    epkVideoId: string,
    setEpkVideoId: React.Dispatch<React.SetStateAction<string>>
}> = ({ bands, activeBandId, releases: allReleases, media: allMediaAssets, articles: allArticles, tours: allTours, bandBio, setBandBio, epkPhotoId, setEpkPhotoId, epkVideoId, setEpkVideoId }) => {
    const [editMode, setEditMode] = useState(false);
    const [showLinkModal, setShowLinkModal] = useState(false);
    
    const activeBand = useMemo(() => bands.find(b => b.id === activeBandId) || bands[0], [bands, activeBandId]);
    const releases = useMemo(() => allReleases.filter(r => r.bandId === activeBandId), [allReleases, activeBandId]);
    const mediaAssets = useMemo(() => allMediaAssets.filter(m => m.bandId === activeBandId), [allMediaAssets, activeBandId]);
    const articles = useMemo(() => allArticles.filter(a => a.bandId === activeBandId), [allArticles, activeBandId]);
    const tours = useMemo(() => allTours.filter(t => t.bandId === activeBandId), [allTours, activeBandId]);


    const contactEmail = `booking@${activeBand.name.toLowerCase().replace(/\s/g, '')}.band`;

    const featuredPhoto = mediaAssets.find(m => m.id === epkPhotoId) || mediaAssets.find(m => m.type === 'Photo');
    const featuredVideo = mediaAssets.find(m => m.id === epkVideoId) || mediaAssets.find(m => m.type === 'Video');
    const latestRelease = [...releases].sort((a,b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime())[0];
    const upcomingShows = tours.flatMap(t => t.shows).filter(s => new Date(s.date) >= new Date()).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const photoOptions = mediaAssets.filter(m => m.type === 'Photo');
    const videoOptions = mediaAssets.filter(m => m.type === 'Video');

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setShowLinkModal(true);
        setTimeout(() => setShowLinkModal(false), 2500);
    };

    return (
        <div>
            {/* Header Controls */}
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold">Electronic Press Kit</h1>
                <div className="flex gap-4">
                    <button onClick={handleCopyLink} className="flex items-center bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">
                        <LinkIcon className="h-5 w-5 mr-2" />
                        Copy Shareable Link
                    </button>
                    <button onClick={() => setEditMode(!editMode)} className="flex items-center bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg">
                        <EditIcon className="h-5 w-5 mr-2" />
                        {editMode ? 'Preview EPK' : 'Edit EPK'}
                    </button>
                </div>
            </div>

            {/* EPK Content */}
            <div className="bg-gray-800 p-6 sm:p-8 lg:p-12 rounded-xl shadow-2xl max-w-4xl mx-auto">
                <header className="text-center mb-8">
                    <h1 className="text-5xl font-bold text-white">{activeBand.name}</h1>
                    <p className="text-xl text-gray-400 mt-2">{activeBand.genre}</p>
                </header>

                {/* Main Photo */}
                <div className="mb-8">
                    {featuredPhoto ? (
                         // In a real app, this would be an actual image URL from storage
                        <div className="bg-gray-700 w-full aspect-video rounded-lg flex items-center justify-center text-gray-500">
                           <p>Featured Photo: "{featuredPhoto.name}"</p>
                        </div>
                    ) : <div className="bg-gray-700 w-full aspect-video rounded-lg flex items-center justify-center text-gray-500"><p>No photo selected</p></div>}
                    {editMode && (
                        <div className="mt-2">
                             <label className="text-sm text-gray-400">Select Featured Photo:</label>
                             <select value={epkPhotoId} onChange={e => setEpkPhotoId(e.target.value)} className="w-full bg-gray-700 p-2 rounded-lg mt-1 text-sm">
                                {photoOptions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                    )}
                </div>

                {/* Bio */}
                <EPKSection icon={<InfoIcon className="h-6 w-6" />} title="Bio">
                    {editMode ? (
                        <textarea value={bandBio} onChange={e => setBandBio(e.target.value)} rows={5} className="w-full bg-gray-700 p-3 rounded-lg text-gray-300"></textarea>
                    ) : (
                        <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{bandBio}</p>
                    )}
                </EPKSection>

                {/* Music */}
                {latestRelease && latestRelease.musicUrl && (
                    <EPKSection icon={<MusicIcon className="h-6 w-6" />} title="Music">
                        <p className="text-gray-400 mb-4">Latest Release: <span className="font-bold text-white">{latestRelease.title}</span></p>
                        <iframe 
                            style={{borderRadius: '12px'}}
                            src={latestRelease.musicUrl}
                            width="100%" 
                            height="152" 
                            frameBorder="0" 
                            allowFullScreen
                            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                            loading="lazy">
                        </iframe>
                    </EPKSection>
                )}
                
                {/* Video */}
                {featuredVideo && featuredVideo.videoUrl && (
                    <EPKSection icon={<VideoIcon className="h-6 w-6" />} title="Video">
                        {editMode && (
                            <div className="mb-4">
                                <label className="text-sm text-gray-400">Select Featured Video:</label>
                                <select value={epkVideoId} onChange={e => setEpkVideoId(e.target.value)} className="w-full bg-gray-700 p-2 rounded-lg mt-1 text-sm">
                                    {videoOptions.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                </select>
                            </div>
                         )}
                        <div className="aspect-video">
                            <iframe className="w-full h-full rounded-lg" src={featuredVideo.videoUrl} title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                        </div>
                    </EPKSection>
                )}

                {/* Press */}
                {articles.length > 0 && (
                     <EPKSection icon={<PressIcon className="h-6 w-6" />} title="Press">
                        <div className="space-y-4">
                            {articles.map(article => (
                                <blockquote key={article.id} className="border-l-4 border-gray-600 pl-4">
                                    <p className="text-lg italic text-white">"{article.title}"</p>
                                    <cite className="text-gray-400 mt-1 block not-italic">- {article.author} at <a href={article.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-spotify-green">{article.outlet}</a></cite>
                                </blockquote>
                            ))}
                        </div>
                    </EPKSection>
                )}

                {/* Upcoming Shows */}
                {upcomingShows.length > 0 && (
                     <EPKSection icon={<CalendarIcon className="h-6 w-6" />} title="Upcoming Shows">
                        <div className="space-y-3">
                            {upcomingShows.map(show => (
                                <div key={show.id} className="bg-gray-700/50 p-3 rounded-lg flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-white">{new Date(show.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                        <p className="text-gray-300">{show.venue}, {show.city}</p>
                                    </div>
                                    <button className="text-sm bg-spotify-green/80 text-white font-bold py-1 px-3 rounded-lg hover:bg-spotify-green">Tickets</button>
                                </div>
                            ))}
                        </div>
                    </EPKSection>
                )}
                
                {/* Contact */}
                <footer className="mt-12 pt-6 border-t border-gray-700 text-center">
                    <h3 className="text-xl font-bold">Contact</h3>
                    <a href={`mailto:${contactEmail}`} className="text-spotify-green text-lg hover:underline">{contactEmail}</a>
                </footer>

            </div>

             {/* Link Copied Modal */}
             {showLinkModal && (
                <div className="fixed bottom-10 right-10 bg-spotify-green text-white py-2 px-5 rounded-lg shadow-lg animate-pulse">
                    Shareable link copied to clipboard!
                </div>
            )}
        </div>
    );
};
