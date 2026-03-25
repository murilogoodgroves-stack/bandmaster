import Groq from "groq-sdk";
import { BandProfile, SearchResult, WebSource, Song, ProductionProject, Task, Transaction, Tour, Release, MerchItem, CalendarEvent, PressContact, LabelContact, RadioContact, Venue, FestivalOpportunity, FundingOpportunity, SoundProfileAnalysis, SoundMatchOpportunity, ResidencyOpportunity, OpeningSlotOpportunity } from '../types';

// Initialize Groq API
const getAI = () => {
    const key = import.meta.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;
    if (!key) {
        console.error("Groq API key is missing. Please set VITE_GROQ_API_KEY in your environment.");
    }
    return new Groq({ apiKey: key || "", dangerouslyAllowBrowser: true });
};

const DEFAULT_MODEL = "llama-3.3-70b-versatile";

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
    const groq = getAI();
    const projectContext = project ? `\nContext: promoting project "${project.name}" (${project.type}).` : '';
    
    const fullPrompt = `Write an email to ${recipientName || (isBulk ? '[Name]' : 'recipients')}.
    Sender: "${bandProfile.name}" (${bandProfile.genre}).
    Goal: ${prompt}
    Tone: ${tone}. Length: ${length}.
    ${projectContext}
    Do not include subject line unless asked. Just the body.`;

    const chatCompletion = await retryAI(() => groq.chat.completions.create({
        messages: [{ role: "user", content: fullPrompt }],
        model: DEFAULT_MODEL,
    }));

    return chatCompletion.choices[0]?.message?.content || "";
};

export const findPressContacts = async (artistQuery: string, pubType: string, country: string, existingResults: any[] = []): Promise<any[]> => {
    const groq = getAI();
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

    const chatCompletion = await retryAI(() => groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: DEFAULT_MODEL,
        response_format: { type: "json_object" }
    }));

    const text = chatCompletion.choices[0]?.message?.content || "[]";
    try {
        const parsed = JSON.parse(text);
        return Array.isArray(parsed) ? parsed : (parsed.contacts || parsed.results || []);
    } catch (e) {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    }
};

export const findLabelContacts = async (genre: string, country: string, size: string, labelName: string, existing: LabelContact[], similarToLabel: string): Promise<any[]> => {
    const groq = getAI();
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

    const chatCompletion = await retryAI(() => groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: DEFAULT_MODEL,
        response_format: { type: "json_object" }
    }));

    const text = chatCompletion.choices[0]?.message?.content || "[]";
    try {
        const parsed = JSON.parse(text);
        return Array.isArray(parsed) ? parsed : (parsed.labels || parsed.results || []);
    } catch (e) {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    }
};

export const searchVenues = async (style: string, city: string, capacity: string, existing: any[] = []): Promise<any[]> => {
    const groq = getAI();
    const prompt = `Find music venues in ${city} suitable for ${style} bands. Capacity: ${capacity}.
    Exclude: ${existing.map(v => v.name).join(', ')}.
    
    Return JSON: { "venues": [{ "name": "Name", "city": "${city}", "description": "Desc", "capacity": number, "bookingEmail": "Email", "contactUrl": "Official URL or empty string" }] }`;

    const chatCompletion = await retryAI(() => groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: DEFAULT_MODEL,
        response_format: { type: "json_object" }
    }));

    const text = chatCompletion.choices[0]?.message?.content || "{}";
    try {
        return JSON.parse(text).venues || [];
    } catch (e) {
        const match = text.match(/\{[\s\S]*\}/);
        return match ? JSON.parse(match[0]).venues || [] : [];
    }
};

export const findOpeningSlotOpportunities = async (genre: string, city: string, dateRange: string): Promise<OpeningSlotOpportunity[]> => {
    const groq = getAI();
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

    const chatCompletion = await retryAI(() => groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: DEFAULT_MODEL,
        response_format: { type: "json_object" }
    }));

    const text = chatCompletion.choices[0]?.message?.content || "[]";
    try {
        const parsed = JSON.parse(text);
        return Array.isArray(parsed) ? parsed : (parsed.opportunities || parsed.results || []);
    } catch (e) {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    }
};

export const searchWeb = async (query: string): Promise<SearchResult> => {
    const groq = getAI();
    const chatCompletion = await retryAI(() => groq.chat.completions.create({
        messages: [{ role: "user", content: query }],
        model: DEFAULT_MODEL,
    }));

    return {
        answer: chatCompletion.choices[0]?.message?.content || "No answer found.",
        sources: [] // Groq doesn't provide grounding sources like Gemini
    };
};

export const getWizardInsight = async (query: string, context: any, bandProfile: BandProfile): Promise<{answer: string, sources?: WebSource[]}> => {
    const groq = getAI();
    
    const prompt = `You are a band management assistant for ${bandProfile.name}.
    Context Data:
    Tasks: ${JSON.stringify(context.tasks.slice(0,10))}
    Events: ${JSON.stringify(context.events.slice(0,5))}
    Financials: Recent transactions: ${JSON.stringify(context.transactions.slice(0,5))}
    
    User Query: "${query}"
    
    Answer based on the Context Data provided. If the query requires outside knowledge, provide general advice based on your training data.
    `;

    const chatCompletion = await retryAI(() => groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: DEFAULT_MODEL,
    }));

    return {
        answer: chatCompletion.choices[0]?.message?.content || "I couldn't find an answer.",
        sources: []
    };
};

export const generateReleasePlan = async (
    releaseInfo: { title: string, type: string, releaseDate: string },
    bandProfile: BandProfile,
    options: { budget?: number, strategyFocus?: string }
): Promise<any> => {
    const groq = getAI();
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

    const chatCompletion = await retryAI(() => groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: DEFAULT_MODEL,
        response_format: { type: "json_object" }
    }));

    try {
        return JSON.parse(chatCompletion.choices[0]?.message?.content || "{}");
    } catch (e) {
        return { strategySummary: "Failed to parse plan.", checklist: [] };
    }
};

export const findTourDatesForArtist = async (artist: string, year: string, continent: string): Promise<any[]> => {
    const groq = getAI();
    const prompt = `Find tour dates for artist "${artist}" in ${year} ${continent !== 'any' ? `in ${continent}` : ''}.
    Return JSON: [ { "date": "YYYY-MM-DD", "city": "City, Country", "venue": "Venue Name" } ]`;
    
    const chatCompletion = await retryAI(() => groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: DEFAULT_MODEL,
        response_format: { type: "json_object" }
    }));
    
    const text = chatCompletion.choices[0]?.message?.content || "[]";
    try {
        const parsed = JSON.parse(text);
        return Array.isArray(parsed) ? parsed : (parsed.dates || parsed.results || []);
    } catch (e) {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    }
};

export const findVenueContactInfo = async (venueName: string, city: string): Promise<any> => {
    const groq = getAI();
    const prompt = `Find contact info for venue "${venueName}" in ${city}.
    Return JSON: { "name": "${venueName}", "city": "${city}", "capacity": number, "bookingEmail": "email", "contactUrl": "url", "description": "short desc" }`;
    
    const chatCompletion = await retryAI(() => groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: DEFAULT_MODEL,
        response_format: { type: "json_object" }
    }));
    
    const text = chatCompletion.choices[0]?.message?.content || "{}";
    try {
        return JSON.parse(text);
    } catch (e) {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    }
};

export const researchFunding = async (query: string, existing: any[] = []): Promise<FundingOpportunity[]> => {
    const groq = getAI();
    const prompt = `Find music funding grants for: "${query}".
    Focus on Germany/Europe if not specified.
    Exclude: ${existing.map(e => e.name).join(', ')}.
    Return JSON: [ { "name": "", "description": "", "url": "", "deadline": "YYYY-MM-DD or Ongoing" } ]`;
    
    const chatCompletion = await retryAI(() => groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: DEFAULT_MODEL,
        response_format: { type: "json_object" }
    }));
    
    const text = chatCompletion.choices[0]?.message?.content || "[]";
    try {
        const parsed = JSON.parse(text);
        return Array.isArray(parsed) ? parsed : (parsed.funding || parsed.results || []);
    } catch (e) {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    }
};

export const researchFestivals = async (genre: string, location: string, timeWindow: string, existing: any[] = []): Promise<FestivalOpportunity[]> => {
    const groq = getAI();
    const prompt = `Find music festivals accepting submissions.
    Genre: ${genre}. Location: ${location}. Timing: ${timeWindow}.
    Exclude: ${existing.map(e => e.name).join(', ')}.
    Return JSON: [ { "name": "", "country": "", "description": "", "url": "", "deadline": "YYYY-MM-DD", "genre": "" } ]`;
    
    const chatCompletion = await retryAI(() => groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: DEFAULT_MODEL,
        response_format: { type: "json_object" }
    }));
    
    const text = chatCompletion.choices[0]?.message?.content || "[]";
    try {
        const parsed = JSON.parse(text);
        return Array.isArray(parsed) ? parsed : (parsed.festivals || parsed.results || []);
    } catch (e) {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    }
};

export const getEuropeanIndieFestivals = async (): Promise<any[]> => {
    const groq = getAI();
    const prompt = `List 20 popular European indie music festivals.
    Return JSON: [ { "name": "", "country": "", "typicalMonth": number (1-12), "url": "", "contactName": "", "contactEmail": "" } ]`;
    
    const chatCompletion = await retryAI(() => groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: DEFAULT_MODEL,
        response_format: { type: "json_object" }
    }));
    
    const text = chatCompletion.choices[0]?.message?.content || "[]";
    try {
        const parsed = JSON.parse(text);
        return Array.isArray(parsed) ? parsed : (parsed.festivals || parsed.results || []);
    } catch (e) {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    }
};

export const generateEmailFromEPK = async (epkData: any, bandProfile: BandProfile): Promise<string> => {
    const groq = getAI();
    const prompt = `Write a booking/pitch email for ${bandProfile.name}.
    Use EPK Data:
    Bio: ${epkData.bio}
    Latest Release: ${epkData.latestRelease?.title}
    Recent Shows: ${epkData.upcomingShows?.map((s: any) => s.venue).join(', ')}
    
    Tone: Professional but exciting.`;
    
    const chatCompletion = await retryAI(() => groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: DEFAULT_MODEL,
    }));
    
    return chatCompletion.choices[0]?.message?.content || "";
};

export const generateReportInsights = async (context: any, bandProfile: BandProfile): Promise<any[]> => {
    const groq = getAI();
    const prompt = `Analyze this band data and provide 3 insights/recommendations.
    Band: ${bandProfile.name}
    Tasks Pending: ${context.tasks.filter((t:any) => t.status!=='Done').length}
    Financial Balance: ${context.transactions.reduce((acc:number, t:any) => t.type==='Income'?acc+t.amount:acc-t.amount, 0)}
    Upcoming Shows: ${context.tours.flatMap((t:any) => t.shows).length}
    
    Return JSON: [ { "id": "1", "text": "Insight text", "severity": "info"|"warning"|"opportunity", "action": { "label": "Button Label", "page": "dashboard" } } ]`;
    
    const chatCompletion = await retryAI(() => groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: DEFAULT_MODEL,
        response_format: { type: "json_object" }
    }));
    
    try {
        const text = chatCompletion.choices[0]?.message?.content || "[]";
        const parsed = JSON.parse(text);
        return Array.isArray(parsed) ? parsed : (parsed.insights || parsed.results || []);
    } catch (e) {
        return [];
    }
};

export const generateReportConfigFromPrompt = async (userPrompt: string, projects: ProductionProject[], users: any[]): Promise<any> => {
    const groq = getAI();
    const prompt = `Translate user request "${userPrompt}" into a report config.
    Available Data Sources: Tasks, Transactions, Shows, Releases.
    Available Filters: status, projectId, type, category.
    Projects: ${projects.map(p => p.name).join(', ')}.
    
    Return JSON: { "dataSource": "Tasks", "displayAs": "Table", "filters": { "status": "Done" } }`;
    
    const chatCompletion = await retryAI(() => groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: DEFAULT_MODEL,
        response_format: { type: "json_object" }
    }));
    
    try {
        return JSON.parse(chatCompletion.choices[0]?.message?.content || "{}");
    } catch (e) {
        return null;
    }
};

export const findRadioContacts = async (genre: string, country: string, existing: any[] = []): Promise<RadioContact[]> => {
    const groq = getAI();
    const exclude = existing.map(e => e.stationName).join(', ');
    const prompt = `Find radio stations for genre: "${genre}" in "${country || 'anywhere'}".
    Exclude: ${exclude}.
    Return JSON: [ { "stationName": "", "contactName": "", "email": "", "country": "", "city": "", "description": "", "url": "" } ]`;
    
    const chatCompletion = await retryAI(() => groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: DEFAULT_MODEL,
        response_format: { type: "json_object" }
    }));
    
    const text = chatCompletion.choices[0]?.message?.content || "[]";
    try {
        const parsed = JSON.parse(text);
        const raw = Array.isArray(parsed) ? parsed : (parsed.stations || parsed.results || []);
        return raw.map((r: any) => ({
            id: '',
            name: r.contactName,
            stationName: r.stationName,
            email: r.email,
            country: r.country,
            city: r.city,
            submissionUrl: r.url,
            description: r.description,
            bandId: ''
        }));
    } catch (e) {
        return [];
    }
};

export const analyzeArtistSoundProfile = async (artistId: string): Promise<SoundProfileAnalysis> => {
    const groq = getAI();
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
    
    const chatCompletion = await retryAI(() => groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: DEFAULT_MODEL,
        response_format: { type: "json_object" }
    }));
    
    const text = chatCompletion.choices[0]?.message?.content || "{}";
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
    const groq = getAI();
    const prompt = `Find 3 music blogs and 3 radio stations that have featured artists similar to "${profile.artistName}" (e.g. ${profile.similarArtists.join(', ')}).
    Exclude: ${existingPress.map(p => p.outlet).join(', ')}, ${existingRadio.map(r => r.stationName).join(', ')}.
    Return JSON:
    {
      "press": [ { "name": "Contact", "outlet": "Blog Name", "email": "email", "country": "", "url": "", "sourceArtist": "Artist A" } ],
      "radio": [ { "name": "DJ", "outlet": "Station", "email": "email", "country": "", "url": "", "sourceArtist": "Artist B" } ]
    }`;
    
    const chatCompletion = await retryAI(() => groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: DEFAULT_MODEL,
        response_format: { type: "json_object" }
    }));
    
    const text = chatCompletion.choices[0]?.message?.content || "{}";
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
    const groq = getAI();
    const prompt = `Find artist residencies for "${discipline}" ${location ? `in ${location}` : ''}.
    ${costType !== 'all' ? `Cost Model: ${costType}` : ''}.
    Exclude: ${existing.map(e => e.name).join(', ')}.
    Return JSON: [ { "name": "", "location": "", "description": "", "url": "", "deadline": "YYYY-MM-DD", "costType": "Paid/Stipend"|"Free"|"Fee Required", "discipline": "" } ]`;
    
    const chatCompletion = await retryAI(() => groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: DEFAULT_MODEL,
        response_format: { type: "json_object" }
    }));
    
    const text = chatCompletion.choices[0]?.message?.content || "[]";
    try {
        const parsed = JSON.parse(text);
        return Array.isArray(parsed) ? parsed : (parsed.residencies || parsed.results || []);
    } catch (e) {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    }
};
