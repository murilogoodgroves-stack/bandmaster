import { BandProfile, SearchResult, WebSource, Song, ProductionProject, Task, Transaction, Tour, Release, MerchItem, CalendarEvent, PressContact, LabelContact, RadioContact, RadioOpportunity, Venue, FestivalOpportunity, FundingOpportunity, SoundProfileAnalysis, SoundMatchOpportunity, ResidencyOpportunity, OpeningSlotOpportunity, Gig } from '../types';
import { authenticatedFetch } from './supabaseClient';
import { getUserStorageKey } from '../state/userStorageScope';

// Provider configurations
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MINIMAX_URL = "https://api.minimax.chat/v1/text/chatcompletion_v2";
const MINIMAX_IMAGE_URL = "https://api.minimax.chat/v1/image_generation";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

// OpenRouter free tier models are preferred
const OPENROUTER_MODEL = "google/gemini-2.0-flash-exp:free";
const MINIMAX_MODEL = "abab6.5s-chat";
const MINIMAX_IMAGE_MODEL = "minimax-v2-image-generation";
const GROQ_MODEL = "llama-3.3-70b-versatile";
const getOpenRouterKey = () => undefined;
const getMiniMaxKey = () => undefined;
const getGroqKey = () => undefined;
const getGeminiKey = () => undefined;

// AI Status tracking
export type AIProviderStatus = 'online' | 'fallback' | 'offline' | 'error';
export interface AIStatus {
    provider: string;
    status: AIProviderStatus;
    message?: string;
    lastUsed?: string;
}

export interface APIUsageLog {
    id: string;
    timestamp: string;
    provider: string;
    action: string;
    tokensUsed?: number;
    success: boolean;
}

let currentAIStatus: AIStatus = { provider: 'None', status: 'online' };
const statusListeners: ((status: AIStatus) => void)[] = [];

// API Rotation System - intelligently alternate between APIs
export interface APIProvider {
    name: string;
    priority: number;
    getKey: () => string | undefined;
    lastUsed?: number;
    failureCount: number;
    successCount: number;
}

const apiProviders: APIProvider[] = [
    { name: 'OpenRouter', priority: 1, getKey: getOpenRouterKey, failureCount: 0, successCount: 0 },
    { name: 'Groq', priority: 2, getKey: getGroqKey, failureCount: 0, successCount: 0 },
    { name: 'MiniMax', priority: 3, getKey: getMiniMaxKey, failureCount: 0, successCount: 0 },
    { name: 'Google Gemini', priority: 4, getKey: getGeminiKey, failureCount: 0, successCount: 0 }
];

export const getAvailableProviders = (): APIProvider[] => {
    return apiProviders.filter(p => p.getKey()).sort((a, b) => {
        // Sort by success rate first, then priority
        const aSuccessRate = a.successCount / Math.max(1, a.successCount + a.failureCount);
        const bSuccessRate = b.successCount / Math.max(1, b.successCount + b.failureCount);
        
        // Prefer providers with higher success rates
        if (Math.abs(aSuccessRate - bSuccessRate) > 0.1) {
            return bSuccessRate - aSuccessRate;
        }
        
        // If success rates are similar, use priority
        return a.priority - b.priority;
    });
};

const resetProviderStats = () => {
    apiProviders.forEach(p => {
        p.failureCount = 0;
        p.successCount = 0;
    });
};

// API Usage tracking
let apiUsageLogs: APIUsageLog[] = [];
let loadedUsageStorageKey = '';
const loadAPIUsageLogs = () => {
    const storageKey = getUserStorageKey('apiUsageLogs');
    if (loadedUsageStorageKey === storageKey) return;
    loadedUsageStorageKey = storageKey;
    apiUsageLogs = [];
    try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
            apiUsageLogs = JSON.parse(stored);
            // Keep only logs from last 30 days
            const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
            apiUsageLogs = apiUsageLogs.filter(log => new Date(log.timestamp).getTime() > thirtyDaysAgo);
        }
    } catch (e) {
        console.warn('Failed to load API usage logs');
    }
};

export const logAPIUsage = (provider: string, action: string, success: boolean, tokensUsed?: number) => {
    loadAPIUsageLogs();
    const log: APIUsageLog = {
        id: `api-${Date.now()}-${Math.random()}`,
        timestamp: new Date().toISOString(),
        provider,
        action,
        tokensUsed,
        success
    };
    apiUsageLogs.push(log);
    localStorage.setItem(loadedUsageStorageKey, JSON.stringify(apiUsageLogs));
    
    // Update provider stats
    const providerEntry = apiProviders.find(p => p.name === provider);
    if (providerEntry) {
        if (success) {
            providerEntry.successCount++;
        } else {
            providerEntry.failureCount++;
        }
    }
};

export const getAPIUsageLogs = (): APIUsageLog[] => {
    loadAPIUsageLogs();
    return apiUsageLogs;
};

export const getAPIUsageStats = () => {
    loadAPIUsageLogs();
    const stats = {
        totalCalls: apiUsageLogs.length,
        successfulCalls: apiUsageLogs.filter(l => l.success).length,
        failedCalls: apiUsageLogs.filter(l => !l.success).length,
        byProvider: {} as Record<string, { count: number; successful: number; failed: number }>,
        last24Hours: 0,
        last7Days: 0
    };

    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);

    apiUsageLogs.forEach(log => {
        const logTime = new Date(log.timestamp).getTime();
        if (logTime > oneDayAgo) stats.last24Hours++;
        if (logTime > sevenDaysAgo) stats.last7Days++;

        if (!stats.byProvider[log.provider]) {
            stats.byProvider[log.provider] = { count: 0, successful: 0, failed: 0 };
        }
        stats.byProvider[log.provider].count++;
        if (log.success) {
            stats.byProvider[log.provider].successful++;
        } else {
            stats.byProvider[log.provider].failed++;
        }
    });

    return stats;
};

export const subscribesToAPIUsageStats = (callback: (stats: any) => void) => {
    // Return current stats immediately
    callback(getAPIUsageStats());
    // Could implement polling or event system if needed
    return () => {};
};

export const subscribeToAIStatus = (callback: (status: AIStatus) => void) => {
    statusListeners.push(callback);
    callback(currentAIStatus);
    return () => {
        const index = statusListeners.indexOf(callback);
        if (index > -1) statusListeners.splice(index, 1);
    };
};

const updateAIStatus = (status: AIStatus) => {
    currentAIStatus = { ...status, lastUsed: new Date().toISOString() };
    statusListeners.forEach(listener => listener(currentAIStatus));
};

// Helper to call AI with fallback logic
// Priority: OpenRouter -> Groq -> MiniMax -> Google Gemini
export const callAI = async (messages: { role: string, content: string }[], jsonMode = false): Promise<string> => {
    const proxyResponse = await authenticatedFetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, jsonMode }),
    });
    const proxyResult = await proxyResponse.json().catch(() => null);
    if (!proxyResponse.ok || typeof proxyResult?.content !== 'string') {
        const message = typeof proxyResult?.message === 'string' ? proxyResult.message : `AI request failed with status ${proxyResponse.status}.`;
        updateAIStatus({ provider: 'None', status: 'error', message });
        logAPIUsage('Unknown', 'AI Query', false);
        throw new Error(message);
    }
    const provider = typeof proxyResult.provider === 'string' ? proxyResult.provider : 'AI';
    const tokensUsed = typeof proxyResult.tokensUsed === 'number' ? proxyResult.tokensUsed : undefined;
    updateAIStatus({ provider, status: 'online' });
    logAPIUsage(provider, 'AI Query', true, tokensUsed);
    return proxyResult.content;

    const openRouterKey = getOpenRouterKey();
    const groqKey = getGroqKey();
    const miniMaxKey = getMiniMaxKey();
    const geminiKey = getGeminiKey();

    if (!openRouterKey && !miniMaxKey && !groqKey && !geminiKey) {
        const msg = "Missing AI API keys. Please set OPENROUTER_API_KEY, GROQ_API_KEY, MINIMAX_API_KEY, or ensure GEMINI_API_KEY is available.";
        updateAIStatus({ provider: 'None', status: 'error', message: msg });
        throw new Error(msg);
    }

    // 1. Try OpenRouter (Primary)
    if (openRouterKey) {
        try {
            const response = await fetch(OPENROUTER_URL, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${openRouterKey}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": window.location.origin,
                    "X-Title": "BANDMATE"
                },
                body: JSON.stringify({
                    model: OPENROUTER_MODEL,
                    messages,
                    response_format: jsonMode ? { type: "json_object" } : undefined,
                    temperature: 0.7
                })
            });

            if (response.ok) {
                const data = await response.json();
                const content = data.choices?.[0]?.message?.content;
                if (content) {
                    updateAIStatus({ provider: 'OpenRouter', status: 'online' });
                    logAPIUsage('OpenRouter', 'AI Query', true, data.usage?.total_tokens);
                    return content;
                }
            }
            console.warn(`OpenRouter failed (Status: ${response.status})`);
            logAPIUsage('OpenRouter', 'AI Query', false);
        } catch (error) {
            console.error("OpenRouter error:", error);
            logAPIUsage('OpenRouter', 'AI Query', false);
        }
    }

    // 2. Try Groq (Secondary)
    if (groqKey) {
        try {
            const response = await fetch(GROQ_URL, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${groqKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: GROQ_MODEL,
                    messages,
                    response_format: jsonMode ? { type: "json_object" } : undefined
                })
            });

            if (response.ok) {
                const data = await response.json();
                const content = data.choices?.[0]?.message?.content;
                if (content) {
                    updateAIStatus({ provider: 'Groq', status: 'fallback', message: 'OpenRouter failed, using Groq' });
                    logAPIUsage('Groq', 'AI Query', true, data.usage?.total_tokens);
                    return content;
                }
            }
            console.warn(`Groq failed (Status: ${response.status})`);
            logAPIUsage('Groq', 'AI Query', false);
        } catch (error) {
            console.error("Groq error:", error);
            logAPIUsage('Groq', 'AI Query', false);
        }
    }

    // 3. Try MiniMax (Tertiary)
    if (miniMaxKey) {
        try {
            const response = await fetch(MINIMAX_URL, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${miniMaxKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: MINIMAX_MODEL,
                    messages,
                    response_format: jsonMode ? { type: "json_object" } : undefined
                })
            });

            if (response.ok) {
                const data = await response.json();
                const content = data.choices?.[0]?.message?.content;
                if (content) {
                    updateAIStatus({ provider: 'MiniMax', status: 'fallback', message: 'Primary providers failed, using MiniMax' });
                    logAPIUsage('MiniMax', 'AI Query', true, data.usage?.total_tokens);
                    return content;
                }
            }
            console.warn(`MiniMax failed (Status: ${response.status})`);
            logAPIUsage('MiniMax', 'AI Query', false);
        } catch (error) {
            console.error("MiniMax error:", error);
            logAPIUsage('MiniMax', 'AI Query', false);
        }
    }

    const finalError = "All AI providers failed. Please check your API keys and quotas.";
    updateAIStatus({ provider: 'None', status: 'error', message: finalError });
    logAPIUsage('Unknown', 'AI Query', false);
    throw new Error(finalError);
};

// Helper to generate images with fallback logic
export const generateImage = async (prompt: string): Promise<string> => {
    const proxyResponse = await authenticatedFetch('/api/ai/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
    });
    const proxyResult = await proxyResponse.json().catch(() => null);
    if (!proxyResponse.ok || typeof proxyResult?.image !== 'string') {
        const message = typeof proxyResult?.message === 'string' ? proxyResult.message : `Image generation failed with status ${proxyResponse.status}.`;
        updateAIStatus({ provider: 'None', status: 'error', message });
        throw new Error(message);
    }
    updateAIStatus({ provider: typeof proxyResult.provider === 'string' ? proxyResult.provider : 'AI', status: 'online' });
    return proxyResult.image;

    const miniMaxKey = getMiniMaxKey();
    const openRouterKey = getOpenRouterKey();

    // 1. Try MiniMax first for images if key is available
    if (miniMaxKey) {
        try {
            const response = await fetch(MINIMAX_IMAGE_URL, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${miniMaxKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: MINIMAX_IMAGE_MODEL,
                    prompt: prompt,
                    response_format: "base64"
                })
            });

            if (response.ok) {
                const data = await response.json();
                const base64 = data.data?.[0]?.b64_json || data.images?.[0]?.url; // MiniMax format varies
                if (base64) {
                    updateAIStatus({ provider: 'MiniMax', status: 'online' });
                    return base64.startsWith('data:') ? base64 : `data:image/png;base64,${base64}`;
                }
            }
            console.warn(`MiniMax Image failed (Status: ${response.status})`);
        } catch (error) {
            console.error("MiniMax Image error:", error);
        }
    }

    // 3. Fallback to OpenRouter (Placeholder/Future)
    if (openRouterKey) {
        try {
            // Future: Implement DALL-E 3 or similar via OpenRouter if available
            console.warn("OpenRouter image generation not implemented for free tier models yet.");
        } catch (error) {
            console.error("OpenRouter Image error:", error);
        }
    }

    const finalError = "Image generation failed or no suitable provider found. Please check your API keys.";
    updateAIStatus({ provider: 'None', status: 'error', message: finalError });
    throw new Error(finalError);
};

// Helper to retry AI calls
export const retryAI = async <T>(operation: () => Promise<T>, retries = 3, delay = 1000): Promise<T> => {
    try {
        return await operation();
    } catch (error) {
        if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
            return retryAI(operation, retries - 1, delay * 2);
        }
        throw error;
    }
};

export type EmailTone = 'Professional' | 'Casual' | 'Enthusiastic' | 'Minimalist';
export type EmailLength = 'Brief' | 'Standard' | 'Detailed';

export const generateEmail = async (
    prompt: string,
    recipientName: string,
    tone: EmailTone,
    length: EmailLength,
    bandProfile: BandProfile,
    isBulk: boolean,
    project?: ProductionProject
): Promise<string> => {
    const projectContext = project ? `\nContext: promoting project "${project.name}" (${project.type}).` : '';
    
    const fullPrompt = `Write an email to ${recipientName || (isBulk ? '[Name]' : 'recipients')}.
    Sender: "${bandProfile.name}" (${bandProfile.genre}).
    Goal: ${prompt}
    Tone: ${tone}. Length: ${length}.
    ${projectContext}
    Do not include subject line unless asked. Just the body.`;

    return await retryAI(() => callAI([{ role: "user", content: fullPrompt }]));
};

export const findPressContacts = async (artistQuery: string, pubType: string, country: string, existingResults: any[] = []): Promise<any[]> => {
    const exclude = existingResults.map(r => r.name).join(', ');
    
    const prompt = `Find 5 music journalists, blogs, or playlist curators who have recently covered artist: "${artistQuery}".
    Type: ${pubType === 'any' ? 'Music Blog, Magazine, or Playlist' : pubType}.
    Location: ${country || 'Anywhere'}.
    Exclude: ${exclude}.
    
    Return JSON format:
    [
      {
        "name": "Journalist/Curator Name",
        "outlet": "Outlet Name",
        "email": "Email or 'N/A' (Must try to find public email)",
        "country": "Country",
        "city": "City",
        "url": "Link to recent article/playlist"
      }
    ]
    IMPORTANT: Return ONLY the JSON array.`;

    const text = await retryAI(() => callAI([{ role: "user", content: prompt }], true));
    try {
        const parsed = JSON.parse(text);
        return Array.isArray(parsed) ? parsed : (parsed.contacts || parsed.results || []);
    } catch (e) {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    }
};

export const findLabelContacts = async (genre: string, country: string, size: string, labelName: string, existing: LabelContact[], similarToLabel: string): Promise<any[]> => {
    const exclude = existing.map(l => l.labelName).join(', ');
    
    const prompt = `Find record labels matching:
    Genre: ${genre}
    Country: ${country}
    Size: ${size}
    Specific Name Search: ${labelName}
    Similar To: ${similarToLabel}
    Exclude: ${exclude}
    
    Find 5 results. Return JSON:
    [
      {
        "labelName": "Name",
        "contactName": "A&R Name or General",
        "email": "Demo/Contact Email",
        "country": "Country",
        "city": "City",
        "description": "Brief description",
        "url": "Website URL",
        "socials": { "instagram": "url", "twitter": "url" }
      }
    ]
    IMPORTANT: Return ONLY the JSON array.`;

    const text = await retryAI(() => callAI([{ role: "user", content: prompt }], true));
    try {
        const parsed = JSON.parse(text);
        return Array.isArray(parsed) ? parsed : (parsed.labels || parsed.results || []);
    } catch (e) {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    }
};

export const searchVenues = async (style: string, city: string, capacity: string, existing: any[] = []): Promise<any[]> => {
    const prompt = `Find music venues in ${city} suitable for ${style} bands. Capacity: ${capacity}.
    Exclude: ${existing.map(v => v.name).join(', ')}.
    
    Return JSON: { "venues": [{ "name": "Name", "city": "${city}", "description": "Desc", "capacity": number, "bookingEmail": "Email", "contactUrl": "Official URL or empty string" }] }`;

    const text = await retryAI(() => callAI([{ role: "user", content: prompt }], true));
    try {
        return JSON.parse(text).venues || [];
    } catch (e) {
        const match = text.match(/\{[\s\S]*\}/);
        return match ? JSON.parse(match[0]).venues || [] : [];
    }
};

export const findOpeningSlotOpportunities = async (genre: string, city: string, dateRange: string): Promise<OpeningSlotOpportunity[]> => {
    const prompt = `Find touring bands or headliners playing in ${city} during ${dateRange} that match the genre "${genre}".
    Focus on mid-tier artists playing venues sized 200-1000 capacity who might need a local support act.
    
    Return JSON:
    [
      {
        "headlinerArtist": "Band Name",
        "date": "YYYY-MM-DD",
        "venue": "Venue Name",
        "city": "${city}",
        "promoterName": "Promoter/Organizer Name (or 'Unknown')",
        "promoterEmail": "Contact Email (or 'Unknown')",
        "sourceUrl": "Link to event/ticket page"
      }
    ]`;

    const text = await retryAI(() => callAI([{ role: "user", content: prompt }], true));
    try {
        const parsed = JSON.parse(text);
        return Array.isArray(parsed) ? parsed : (parsed.opportunities || parsed.results || []);
    } catch (e) {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    }
};

export const searchWeb = async (query: string): Promise<SearchResult> => {
    const answer = await retryAI(() => callAI([{ role: "user", content: query }]));

    return {
        answer,
        sources: []
    };
};

export const getWizardInsight = async (query: string, context: any, bandProfile: BandProfile): Promise<{answer: string, sources?: WebSource[]}> => {
    const prompt = `You are a band management assistant for ${bandProfile.name}.
    Context Data:
    Tasks: ${JSON.stringify(context.tasks.slice(0,10))}
    Events: ${JSON.stringify(context.events.slice(0,5))}
    Financials: Recent transactions: ${JSON.stringify(context.transactions.slice(0,5))}
    
    User Query: "${query}"
    
    Answer based on the Context Data provided. If the query requires outside knowledge, provide general advice based on your training data.
    `;

    const answer = await retryAI(() => callAI([{ role: "user", content: prompt }]));

    return {
        answer,
        sources: []
    };
};

export const generateReleasePlan = async (
    releaseInfo: { title: string, type: string, releaseDate: string },
    bandProfile: BandProfile,
    options: { budget?: number, strategyFocus?: string }
): Promise<any> => {
    const prompt = `Create a release marketing plan for ${bandProfile.name} (${bandProfile.genre}).
    Release: "${releaseInfo.title}" (${releaseInfo.type}), Date: ${releaseInfo.releaseDate}.
    Budget: ${options.budget ? `$${options.budget}` : 'Low budget'}.
    Focus: ${options.strategyFocus || 'General growth'}.
    
    Return JSON:
    {
      "strategySummary": "Overview of strategy...",
      "checklist": [
        {
          "phase": "Phase Name",
          "category": "Category",
          "text": "Task description",
          "deadlineOffsetDays": number (negative for before release, positive after),
          "priority": "Critical" | "High" | "Medium" | "Low"
        }
      ]
    }`;

    const text = await retryAI(() => callAI([{ role: "user", content: prompt }], true));

    try {
        return JSON.parse(text || "{}");
    } catch (e) {
        return { strategySummary: "Failed to parse plan.", checklist: [] };
    }
};

export const findTourDatesForArtist = async (artist: string, year: string, continent: string): Promise<any[]> => {
    const prompt = `Find tour dates for artist "${artist}" in ${year} ${continent !== 'any' ? `in ${continent}` : ''}.
    Return JSON: [ { "date": "YYYY-MM-DD", "city": "City, Country", "venue": "Venue Name" } ]`;
    
    const text = await retryAI(() => callAI([{ role: "user", content: prompt }], true));
    try {
        const parsed = JSON.parse(text);
        return Array.isArray(parsed) ? parsed : (parsed.dates || parsed.results || []);
    } catch (e) {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    }
};

export const findVenueContactInfo = async (venueName: string, city: string): Promise<any> => {
    const prompt = `Find contact info for venue "${venueName}" in ${city}.
    Return JSON: { "name": "${venueName}", "city": "${city}", "capacity": number, "bookingEmail": "email", "contactUrl": "url", "description": "short desc" }`;
    
    const text = await retryAI(() => callAI([{ role: "user", content: prompt }], true));
    try {
        return JSON.parse(text);
    } catch (e) {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    }
};

export const researchFunding = async (query: string, existing: any[] = []): Promise<FundingOpportunity[]> => {
    const prompt = `Find music funding grants for: "${query}".
    Focus on Germany/Europe if not specified.
    Exclude: ${existing.map(e => e.name).join(', ')}.
    Return JSON: [ { "name": "", "description": "", "url": "", "deadline": "YYYY-MM-DD or Ongoing" } ]`;
    
    const text = await retryAI(() => callAI([{ role: "user", content: prompt }], true));
    try {
        const parsed = JSON.parse(text);
        return Array.isArray(parsed) ? parsed : (parsed.funding || parsed.results || []);
    } catch (e) {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    }
};

export const researchFestivals = async (genre: string, location: string, timeWindow: string, existing: any[] = []): Promise<FestivalOpportunity[]> => {
    const prompt = `Find music festivals accepting submissions.
    Genre: ${genre}. Location: ${location}. Timing: ${timeWindow}.
    Exclude: ${existing.map(e => e.name).join(', ')}.
    Return JSON: [ { "name": "", "country": "", "description": "", "url": "", "deadline": "YYYY-MM-DD", "genre": "" } ]`;
    
    const text = await retryAI(() => callAI([{ role: "user", content: prompt }], true));
    try {
        const parsed = JSON.parse(text);
        return Array.isArray(parsed) ? parsed : (parsed.festivals || parsed.results || []);
    } catch (e) {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    }
};

export const getEuropeanIndieFestivals = async (): Promise<any[]> => {
    const prompt = `List 20 popular European indie music festivals.
    Return JSON: [ { "name": "", "country": "", "typicalMonth": number (1-12), "url": "", "contactName": "", "contactEmail": "" } ]`;
    
    const text = await retryAI(() => callAI([{ role: "user", content: prompt }], true));
    try {
        const parsed = JSON.parse(text);
        return Array.isArray(parsed) ? parsed : (parsed.festivals || parsed.results || []);
    } catch (e) {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    }
};

export const generateGigEmail = async (
    gig: Gig,
    bandProfile: BandProfile,
    tone: EmailTone,
    length: EmailLength,
    customPrompt: string
): Promise<string> => {
    const prompt = `Write a booking/pitch email for the following gig opportunity:
    Event: ${gig.eventName}
    Date: ${gig.date}
    Location: ${gig.location}
    Headliner (if any): ${gig.headlinerArtist || 'N/A'}
    
    Sender: ${bandProfile.name} (${bandProfile.genre})
    
    Specific Instructions: ${customPrompt || 'Standard booking pitch'}
    Tone: ${tone}
    Length: ${length}
    
    The email should be addressed to the promoter/venue contact. 
    Do not include a subject line. Just the body.`;

    return await retryAI(() => callAI([{ role: "user", content: prompt }]));
};

export const createEmailTemplate = async (
    emailBody: string,
    bandProfile: BandProfile
): Promise<string> => {
    const prompt = `Generalize the following email body into a reusable template. 
    Replace specific names, dates, and locations with placeholders like [Promoter Name], [Date], [Venue Name], [Event Name], [Headliner Name].
    Keep the core pitch and tone.
    
    Email Body:
    ${emailBody}
    
    Return ONLY the template text.`;

    return await retryAI(() => callAI([{ role: "user", content: prompt }]));
};

export const generateEmailFromEPK = async (epkData: any, bandProfile: BandProfile): Promise<string> => {
    const prompt = `Write a professional outreach email for ${bandProfile.name} (${bandProfile.genre}).
    Use the following EPK data:
    Bio: ${epkData.bio}
    Latest Release: ${epkData.latestRelease ? `${epkData.latestRelease.title} (${epkData.latestRelease.type})` : 'N/A'}
    Upcoming Shows: ${epkData.upcomingShows.map((s: any) => `${s.date} at ${s.venue}`).join(', ')}
    
    The email should be a general pitch to industry professionals (labels, press, or venues).
    Keep it professional, concise, and engaging.
    Do not include subject line. Just the body.`;

    return await retryAI(() => callAI([{ role: "user", content: prompt }]));
};

export const generateReportInsights = async (context: any, bandProfile: BandProfile): Promise<any[]> => {
    const prompt = `Analyze this band data and provide 3 insights/recommendations.
    Band: ${bandProfile.name}
    Tasks Pending: ${context.tasks.filter((t:any) => t.status!=='Done').length}
    Financial Balance: ${context.transactions.reduce((acc:number, t:any) => t.type==='Income'?acc+t.amount:acc-t.amount, 0)}
    Upcoming Shows: ${context.tours.flatMap((t:any) => t.shows).length}
    
    Return JSON: [ { "id": "1", "text": "Insight text", "severity": "info"|"warning"|"opportunity", "action": { "label": "Button Label", "page": "dashboard" } } ]`;
    
    const text = await retryAI(() => callAI([{ role: "user", content: prompt }], true));
    try {
        const parsed = JSON.parse(text);
        return Array.isArray(parsed) ? parsed : (parsed.insights || parsed.results || []);
    } catch (e) {
        return [];
    }
};

export const generateReportConfigFromPrompt = async (userPrompt: string, projects: ProductionProject[], users: any[]): Promise<any> => {
    const prompt = `Translate user request "${userPrompt}" into a report config.
    Available Data Sources: Tasks, Transactions, Shows, Releases.
    Available Filters: status, projectId, type, category.
    Projects: ${projects.map(p => p.name).join(', ')}.
    
    Return JSON: { "dataSource": "Tasks", "displayAs": "Table", "filters": { "status": "Done" } }`;
    
    const text = await retryAI(() => callAI([{ role: "user", content: prompt }], true));
    try {
        return JSON.parse(text || "{}");
    } catch (e) {
        return null;
    }
};

export const findRadioContacts = async (genre: string, country: string, existing: any[] = []): Promise<RadioOpportunity[]> => {
    const exclude = existing.map(e => e.stationName).join(', ');
    const prompt = `Find radio stations for genre: "${genre}" in "${country || 'anywhere'}".
    Exclude: ${exclude}.
    Return JSON: [ { "stationName": "", "contactName": "", "email": "", "country": "", "city": "", "description": "", "url": "" } ]`;
    
    const text = await retryAI(() => callAI([{ role: "user", content: prompt }], true));
    try {
        const parsed = JSON.parse(text);
        const raw = Array.isArray(parsed) ? parsed : (parsed.stations || parsed.results || []);
        return raw.map((r: any) => ({
            stationName: r.stationName || '',
            contactName: r.contactName || '',
            email: r.email || '',
            country: r.country || '',
            city: r.city || '',
            description: r.description || '',
            url: r.url || ''
        }));
    } catch (e) {
        return [];
    }
};

export const analyzeArtistSoundProfile = async (artistId: string): Promise<SoundProfileAnalysis> => {
    const prompt = `Analyze the sound profile of Spotify Artist ID: ${artistId}.
    Search the web for reviews, descriptions, and similar artists.
    Return JSON:
    {
      "artistName": "",
      "genres": ["genre1", "genre2"],
      "moods": ["mood1", "mood2"],
      "instrumentation": ["guitar", "synth"],
      "tempo": "Fast/Slow/Varied",
      "summary": "Short description of sound",
      "similarArtists": ["Artist A", "Artist B"],
      "reasoning": "Why this analysis matches"
    }`;
    
    const text = await retryAI(() => callAI([{ role: "user", content: prompt }], true));
    try {
        return JSON.parse(text);
    } catch (e) {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : {} as any;
    }
};

export const findOpportunitiesFromProfile = async (
    profile: SoundProfileAnalysis, 
    existingPress: any[], 
    existingRadio: any[]
): Promise<{ press: SoundMatchOpportunity[], radio: SoundMatchOpportunity[] }> => {
    const prompt = `Find 3 music blogs and 3 radio stations that have featured artists similar to "${profile.artistName}" (e.g. ${profile.similarArtists.join(', ')}).
    Exclude: ${existingPress.map(p => p.outlet).join(', ')}, ${existingRadio.map(r => r.stationName).join(', ')}.
    Return JSON:
    {
      "press": [ { "name": "Contact", "outlet": "Blog Name", "email": "email", "country": "", "url": "", "sourceArtist": "Artist A" } ],
      "radio": [ { "name": "DJ", "outlet": "Station", "email": "email", "country": "", "url": "", "sourceArtist": "Artist B" } ]
    }`;
    
    const text = await retryAI(() => callAI([{ role: "user", content: prompt }], true));
    try {
        const result = JSON.parse(text);
        // Ensure types
        result.press = (result.press || []).map((p: any) => ({ ...p, type: 'press' }));
        result.radio = (result.radio || []).map((r: any) => ({ ...r, type: 'radio' }));
        return result;
    } catch (e) {
        return { press: [], radio: [] };
    }
};

export const findResidencies = async (discipline: string, location: string, costType: string, existing: any[] = []): Promise<ResidencyOpportunity[]> => {
    const prompt = `Find artist residencies for "${discipline}" ${location ? `in ${location}` : ''}.
    ${costType !== 'all' ? `Cost Model: ${costType}` : ''}.
    Exclude: ${existing.map(e => e.name).join(', ')}.
    Return JSON: [ { "name": "", "location": "", "description": "", "url": "", "deadline": "YYYY-MM-DD", "costType": "Paid/Stipend"|"Free"|"Fee Required", "discipline": "" } ]`;
    
    const text = await retryAI(() => callAI([{ role: "user", content: prompt }], true));
    try {
        const parsed = JSON.parse(text);
        return Array.isArray(parsed) ? parsed : (parsed.residencies || parsed.results || []);
    } catch (e) {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    }
};
