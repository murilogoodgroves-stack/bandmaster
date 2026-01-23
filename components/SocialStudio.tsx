
import React, { useState, useMemo } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import useLocalStorage from '../hooks/useLocalStorage';
import { initialBandProfiles } from '../data/initialData';
import { BotIcon, DownloadIcon, ImageIcon, FileTextIcon, VideoIcon, CopyIcon, WandIcon } from './icons';
import type { BandProfile } from '../types';

const imageStyles = ["Cinematic", "Vintage Film", "Psychedelic", "Minimalist Black & White", "Grunge", "Dreamy & Ethereal", "Lo-fi Analog"];

export const SocialStudio: React.FC<{ bands: BandProfile[] }> = ({ bands }) => {
    const [activeTab, setActiveTab] = useState<'captions' | 'images' | 'video'>('captions');

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-4xl font-bold">AI Social Studio</h1>
            </div>
            <div className="flex border-b border-brand-border mb-6">
                <button onClick={() => setActiveTab('captions')} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${activeTab === 'captions' ? 'border-b-2 border-brand-accent text-white' : 'text-gray-400'}`}>
                    <FileTextIcon className="w-5 h-5" /> Caption Generator
                </button>
                <button onClick={() => setActiveTab('images')} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${activeTab === 'images' ? 'border-b-2 border-brand-accent text-white' : 'text-gray-400'}`}>
                    <ImageIcon className="w-5 h-5" /> Image Generator
                </button>
                 <button onClick={() => setActiveTab('video')} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${activeTab === 'video' ? 'border-b-2 border-brand-accent text-white' : 'text-gray-400'}`}>
                    <VideoIcon className="w-5 h-5" /> Video Tools
                </button>
            </div>
            {activeTab === 'captions' && <CaptionGenerator bands={bands} />}
            {activeTab === 'images' && <ImageGenerator />}
            {activeTab === 'video' && <VideoGeneratorPlaceholder />}
        </div>
    );
};

const CaptionGenerator: React.FC<{ bands: BandProfile[] }> = ({ bands }) => {
    const [prompt, setPrompt] = useState('');
    const [tone, setTone] = useState('Excited');
    const [platform, setPlatform] = useState('Instagram');
    const [activeBandId] = useLocalStorage<string>('activeBandId', 'b1');
    
    // Persist generated captions
    const [captions, setCaptions] = useLocalStorage<string[]>(`social_captions_${activeBandId}`, []);
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const bandProfile = useMemo(() => bands.find(b => b.id === activeBandId) || bands[0], [bands, activeBandId]);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setIsLoading(true);
        setError('');
        setCaptions([]);

        const fullPrompt = `You are a social media manager for an indie band called "${bandProfile.name}". Their genre is ${bandProfile.genre}.
        Generate 10 creative social media captions for ${platform}.
        The tone should be: ${tone}.
        The post is about: "${prompt}".
        Include relevant hashtags. Format the output as a plain text list, with each caption separated by "---".`;

        const taskId = `task-captions-${Date.now()}`;
        window.dispatchEvent(new CustomEvent('start-task', { detail: { id: taskId, name: 'Generating social media captions...', estimatedDuration: 15 } }));

        try {
            if (!process.env.API_KEY) throw new Error("API key not configured.");
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: fullPrompt });
            const generatedText = response.text;
            setCaptions(generatedText.split('---').map(s => s.trim()).filter(Boolean));
        } catch (e) {
            setError(e instanceof Error ? e.message : "An unknown error occurred.");
        } finally {
            setIsLoading(false);
            window.dispatchEvent(new CustomEvent('end-task', { detail: { id: taskId } }));
        }
    };

    const handleCopy = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    return (
        <div className="bg-brand-bg-card p-6 rounded-xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="What's the post about? (e.g., New single coming out Friday)" rows={4} className="md:col-span-3 w-full bg-brand-bg-content p-2 rounded-lg text-sm" />
                <select value={tone} onChange={e => setTone(e.target.value)} className="bg-brand-bg-content p-2 rounded text-sm"><option>Excited</option><option>Mysterious</option><option>Funny</option><option>Professional</option><option>Introspective</option></select>
                <select value={platform} onChange={e => setPlatform(e.target.value)} className="bg-brand-bg-content p-2 rounded text-sm"><option>Instagram</option><option>TikTok</option><option>Twitter/X</option><option>Facebook</option></select>
                <button onClick={handleGenerate} disabled={isLoading} className="flex items-center justify-center bg-brand-accent hover:bg-brand-accent-dark text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-600">
                    <WandIcon className="w-5 h-5 mr-2"/>Generate Captions
                </button>
            </div>
            {isLoading && <p className="text-center mt-4 text-gray-400">AI is writing...</p>}
            {error && <p className="text-center mt-4 text-red-400">{error}</p>}
            {captions.length > 0 && (
                <div className="mt-6 space-y-3">
                    {captions.map((caption, i) => (
                        <div key={i} className="bg-brand-bg-content p-3 rounded-lg flex justify-between items-start">
                            <p className="text-sm text-gray-300 whitespace-pre-wrap flex-grow">{caption}</p>
                            <button onClick={() => handleCopy(caption, i)} className="ml-4 p-2 bg-gray-600 hover:bg-gray-500 rounded-lg flex-shrink-0">
                                <CopyIcon className="w-4 h-4"/>
                            </button>
                            {copiedIndex === i && <span className="text-xs text-green-400 ml-2">Copied!</span>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const ImageGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [style, setStyle] = useState(imageStyles[0]);
    const [activeBandId] = useLocalStorage<string>('activeBandId', 'b1');
    // Persist generated image
    const [imageUrl, setImageUrl] = useLocalStorage<string | null>(`social_image_${activeBandId}`, null);
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setIsLoading(true);
        setError('');
        setImageUrl(null);

        const fullPrompt = `Generate an image for a social media post for an indie rock band. The post is about: "${prompt}". The style should be: ${style}.`;

        const taskId = `task-imagegen-${Date.now()}`;
        window.dispatchEvent(new CustomEvent('start-task', { detail: { id: taskId, name: 'Generating social media image...', estimatedDuration: 30 } }));

        try {
            if (!process.env.API_KEY) throw new Error("API key not configured.");
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ text: fullPrompt }] },
                config: { responseModalities: [Modality.IMAGE] },
            });
            
            const part = response.candidates?.[0]?.content?.parts?.[0];
            if (part?.inlineData) {
                setImageUrl(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
            } else {
                throw new Error("The AI did not return an image. Please try refining your prompt.");
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : "An unknown error occurred.");
        } finally {
            setIsLoading(false);
            window.dispatchEvent(new CustomEvent('end-task', { detail: { id: taskId } }));
        }
    };

    return (
        <div className="bg-brand-bg-card p-6 rounded-xl">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Describe the image you want..." rows={3} className="md:col-span-2 w-full bg-brand-bg-content p-2 rounded-lg text-sm" />
                <div className="space-y-2">
                    <select value={style} onChange={e => setStyle(e.target.value)} className="bg-brand-bg-content p-2 rounded text-sm w-full">
                        {imageStyles.map(s => <option key={s}>{s}</option>)}
                    </select>
                     <button onClick={handleGenerate} disabled={isLoading} className="w-full flex items-center justify-center bg-brand-accent hover:bg-brand-accent-dark text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-600">
                        <WandIcon className="w-5 h-5 mr-2"/>Generate Image
                    </button>
                </div>
            </div>
            <div className="w-full aspect-video bg-brand-bg-content rounded-lg flex items-center justify-center mt-4">
                {isLoading && <p className="text-gray-400">AI is creating your image...</p>}
                {error && <p className="text-red-400 p-4">{error}</p>}
                {imageUrl && <img src={imageUrl} alt="AI generated content" className="w-full h-full object-contain" />}
                {!isLoading && !imageUrl && !error && <p className="text-gray-500">Your image will appear here</p>}
            </div>
             {imageUrl && (
                <a href={imageUrl} download="bandhq_social_image.png" className="w-full mt-4 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg">
                    <DownloadIcon className="w-5 h-5 mr-2" />
                    Download Image
                </a>
            )}
        </div>
    );
};

const VideoGeneratorPlaceholder: React.FC = () => (
    <div className="bg-brand-bg-card p-6 rounded-xl text-center">
        <h2 className="text-2xl font-bold mb-4">AI Video Tools</h2>
        <p className="text-gray-400 max-w-md mx-auto">This feature is coming soon! You'll be able to generate simple, stylized lyric videos and audio visualizers for your tracks, perfect for TikTok, Reels, and YouTube Shorts.</p>
    </div>
);
