import React, { useState, useEffect } from 'react';
import { mockBase44 as base44 } from '@/api/mockBase44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2, Sparkles, Wand2, HelpCircle, X } from "lucide-react";
import { toast } from "sonner";
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { specialLabels } from '../constants';
import CreatorOnboardingGuide from './CreatorOnboardingGuide';

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationPicker({ position, onLocationSelect }) {
    useMapEvents({
        click(e) {
            onLocationSelect(e.latlng);
        },
    });
    return position ? <Marker position={position} /> : null;
}

export default function CreatorLocationForm({ isOpen, onOpenChange, user, onSuccess }) {
    const [formData, setFormData] = useState({
        name: '',
        type: 'cafe',
        country: 'Poland',
        city: 'Warsaw',
        address: '',
        description: '',
        insider_tip: '',
        must_try: '',
        price_range: '$$',
        website: '',
        phone: '',
        opening_hours: '',
        booking_url: '',
        image_url: '',
        latitude: '',
        longitude: '',
        special_labels: [],
        social_links: [],
        tags: []
    });
    const [branches, setBranches] = useState([{
        id: Date.now(),
        branch_name: '',
        address: '',
        latitude: '',
        longitude: '',
        phone: '',
        opening_hours: '',
        is_main: true
    }]);
    const [socialLinkInput, setSocialLinkInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [smartSearchQuery, setSmartSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [generatingContent, setGeneratingContent] = useState({
        description: false,
        insider_tip: false,
        must_try: false
    });
    const [uploadingImage, setUploadingImage] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [selectedPlace, setSelectedPlace] = useState(null);
    const [showResults, setShowResults] = useState(false);
    const [isAutoSearching, setIsAutoSearching] = useState(false);
    const [tagsInput, setTagsInput] = useState('');

    // Check if user needs to see onboarding
    useEffect(() => {
        if (isOpen && user && !user.has_seen_location_onboarding) {
            setShowOnboarding(true);
        }
    }, [isOpen, user]);

    // Auto-search with debounce
    useEffect(() => {
        if (!smartSearchQuery || smartSearchQuery.length < 3) {
            setSearchResults([]);
            setShowResults(false);
            setSelectedPlace(null);
            return;
        }

        // Debounce search
        const timeoutId = setTimeout(() => {
            performAutoSearch();
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [smartSearchQuery]);

    const performAutoSearch = async () => {
        if (!smartSearchQuery || smartSearchQuery.length < 3) return;

        setIsAutoSearching(true);
        try {
            const searchPrompt = `Search for places matching: "${smartSearchQuery}"
            
            Find up to 5 similar locations from Google Maps and return them as a list.
            For each location provide:
            - name: exact business name
            - address: full address with city and country
            - description: brief 1-sentence description of what this place is
            
            Return a JSON array of results. If only one exact match found, return array with just that one result.`;

            const searchResults = await base44.integrations.Core.InvokeLLM({
                prompt: searchPrompt,
                add_context_from_internet: true,
                response_json_schema: {
                    type: "object",
                    properties: {
                        results: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    name: { type: "string" },
                                    address: { type: "string" },
                                    description: { type: "string" }
                                }
                            }
                        }
                    }
                }
            });

            if (searchResults?.results && searchResults.results.length > 0) {
                setSearchResults(searchResults.results);
                setShowResults(true);
            } else {
                setSearchResults([]);
                setShowResults(false);
            }
        } catch (error) {
            console.error('Auto-search error:', error);
            setSearchResults([]);
            setShowResults(false);
        } finally {
            setIsAutoSearching(false);
        }
    };

    const handleOnboardingComplete = async () => {
        setShowOnboarding(false);
        try {
            await base44.auth.updateMe({ has_seen_location_onboarding: true });
        } catch (error) {
            console.error('Error updating onboarding status:', error);
        }
    };

    const handleOnboardingSkip = async () => {
        setShowOnboarding(false);
        try {
            await base44.auth.updateMe({ has_seen_location_onboarding: true });
        } catch (error) {
            console.error('Error updating onboarding status:', error);
        }
    };

    const handleSelectPlace = (place) => {
        setSelectedPlace(place);
        setSmartSearchQuery(`${place.name} - ${place.address}`);
        setShowResults(false);
    };

    const handleFillFromSelected = async () => {
        if (!selectedPlace) {
            toast.error('Please select a location first');
            return;
        }

        setIsSearching(true);
        try {
            // Try Google Places API first
            toast.info('Searching location data...');
            const googleResult = await base44.functions.invoke('searchGooglePlaces', {
                query: `${selectedPlace.name} ${selectedPlace.address}`
            });

            if (googleResult.data?.success && googleResult.data.places?.length > 0) {
                const place = googleResult.data.places[0];

                // Map Google Places data to form
                const mappedData = {
                    name: place.name || selectedPlace.name,
                    address: place.address || selectedPlace.address,
                    latitude: place.latitude || '',
                    longitude: place.longitude || '',
                    website: place.website || '',
                    phone: place.phone || '',
                    opening_hours: place.openingHours || '',
                    description: place.description || '',
                    must_try: place.must_try || '',
                    image_url: place.photos?.[0]?.reference ?
                        `https://places.googleapis.com/v1/${place.photos[0].reference}/media?key=${Deno.env.get('GOOGLE_PLACES_API_KEY')}&maxHeightPx=800&maxWidthPx=1200`
                        : '',
                    social_links: place.social_links || []
                };

                // Determine type from primaryType
                const typeMap = {
                    'cafe': 'cafe',
                    'coffee_shop': 'cafe',
                    'bar': 'bar',
                    'restaurant': 'restaurant',
                    'market': 'market',
                    'supermarket': 'market',
                    'bakery': 'bakery',
                    'winery': 'winery',
                    'store': 'shop',
                    'shop': 'shop'
                };
                if (place.primaryType) {
                    const detectedType = typeMap[place.primaryType.toLowerCase()] || 'cafe';
                    mappedData.type = detectedType;
                }

                // Map price level
                if (place.priceLevel) {
                    const priceLevelMap = {
                        'PRICE_LEVEL_INEXPENSIVE': '$',
                        'PRICE_LEVEL_MODERATE': '$$',
                        'PRICE_LEVEL_EXPENSIVE': '$$$',
                        'PRICE_LEVEL_VERY_EXPENSIVE': '$$$$'
                    };
                    mappedData.price_range = priceLevelMap[place.priceLevel] || '$$';
                }

                // Extract city and country from address
                const addressParts = place.address?.split(',') || [];
                if (addressParts.length >= 2) {
                    mappedData.city = normalizeCityName(addressParts[addressParts.length - 2]?.trim() || '');
                    mappedData.country = normalizeCityName(addressParts[addressParts.length - 1]?.trim() || '');
                }

                // Filter out empty values
                const filteredData = Object.entries(mappedData).reduce((acc, [key, value]) => {
                    if (key === 'social_links') {
                        acc[key] = Array.isArray(value) ? value.filter(link => link && link !== "") : [];
                    } else if (value && value !== "" && value !== 0) {
                        acc[key] = value;
                    }
                    return acc;
                }, {});

                setFormData(prev => ({
                    ...prev,
                    ...filteredData,
                    social_links: [...(prev.social_links || []), ...(filteredData.social_links || [])]
                        .filter((link, index, self) => self.indexOf(link) === index)
                }));

                // Update main branch with coordinates
                if (filteredData.latitude && filteredData.longitude) {
                    setBranches(prev => prev.map((b, i) => i === 0 ? {
                        ...b,
                        address: filteredData.address || b.address,
                        latitude: filteredData.latitude,
                        longitude: filteredData.longitude,
                        phone: filteredData.phone || b.phone,
                        opening_hours: filteredData.opening_hours || b.opening_hours
                    } : b));
                }

                setShowResults(false);
                setSearchResults([]);
                setSelectedPlace(null);
                setSmartSearchQuery('');

                toast.success(googleResult.data.source === 'google_places'
                    ? 'Location data filled from Google Places!'
                    : 'Location data filled from web search!');
                return;
            }

            // Fallback to old LLM-based method if Google Places fails
            toast.info('Using alternative search method...');
            const prompt = `You are a location data extraction assistant. Extract COMPREHENSIVE information about this SPECIFIC location:
            
Name: ${selectedPlace.name}
Address: ${selectedPlace.address}

COMPREHENSIVE SEARCH STRATEGY:
1. FIRST: Search on Google Maps for exact location, coordinates, and basic info
2. THEN: Find the venue's official website
3. NEXT: Search for social media pages (Instagram, Facebook, TikTok, etc.)
4. ALSO: Check review platforms (TripAdvisor, Yelp, Google Reviews) for popular items
5. FINALLY: Look for blog posts or articles mentioning this venue

Return a JSON object with these fields:
- name: exact name of the place
- type: one of [cafe, bar, restaurant, market, shop, bakery, winery]
- city: ENGLISH transliteration of city name (e.g., "Warsaw" not "Warszawa", "Krakow" not "Kraków")
- country: ENGLISH name of country (e.g., "Poland" not "Polska")
- address: full street address in LOCAL format as it appears on Google Maps (with local street names like "ul. Nowy Świat" - this is needed for proper navigation)
- description: comprehensive description (2-3 sentences) in Russian
- price_range: one of [$, $$, $$$, $$$$]
- website: official website URL (empty string if not found)
- latitude: exact GPS latitude from Google Maps (0 if not found)
- longitude: exact GPS longitude from Google Maps (0 if not found)
- image_url: URL to quality photo (empty string if not found)
- must_try: popular dish/item in Russian (empty string if not found)
- social_links: array of social media URLs (empty array if none found)

CRITICAL ADDRESSING RULES:
- city & country: MUST be in English (Warsaw, Krakow, Prague, Vienna, etc.)
- address: MUST be in LOCAL format from Google Maps (ul. Nowy Świat, Warszawa or Karmelicka 45, Kraków)
This ensures proper navigation in Google/Apple Maps while keeping UI in English.

CRITICAL: Use the NAME and ADDRESS provided to find the EXACT location. Search multiple sources for complete information.`;

            const result = await base44.integrations.Core.InvokeLLM({
                prompt,
                add_context_from_internet: true,
                response_json_schema: {
                    type: "object",
                    properties: {
                        name: { type: "string" },
                        type: { type: "string" },
                        city: { type: "string" },
                        country: { type: "string" },
                        address: { type: "string" },
                        description: { type: "string" },
                        price_range: { type: "string" },
                        website: { type: "string" },
                        latitude: { type: "number" },
                        longitude: { type: "number" },
                        image_url: { type: "string" },
                        must_try: { type: "string" },
                        social_links: {
                            type: "array",
                            items: { type: "string" }
                        }
                    }
                }
            });

            if (result) {
                const filteredResult = Object.entries(result).reduce((acc, [key, value]) => {
                    if (key === 'social_links') {
                        acc[key] = Array.isArray(value) ? value.filter(link => link && link !== "") : [];
                    } else if (key === 'city' || key === 'country') {
                        // Normalize city and country names to English
                        acc[key] = value ? normalizeCityName(value) : value;
                    } else if (value && value !== "" && value !== 0) {
                        acc[key] = value;
                    }
                    return acc;
                }, {});

                setFormData(prev => ({
                    ...prev,
                    ...filteredResult,
                    social_links: [...(prev.social_links || []), ...(filteredResult.social_links || [])]
                        .filter((link, index, self) => self.indexOf(link) === index)
                }));

                // Update main branch
                if (filteredResult.latitude && filteredResult.longitude) {
                    setBranches(prev => prev.map((b, i) => i === 0 ? {
                        ...b,
                        address: filteredResult.address || b.address,
                        latitude: filteredResult.latitude,
                        longitude: filteredResult.longitude
                    } : b));
                }

                setShowResults(false);
                setSearchResults([]);
                setSelectedPlace(null);
                setSmartSearchQuery('');

                toast.success('Location data filled successfully!');
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch location details');
        } finally {
            setIsSearching(false);
        }
    };

    const detectLanguage = (text) => {
        if (!text) return 'english';
        if (/[а-яА-ЯёЁ]/.test(text)) return 'russian';
        if (/[іїєґІЇЄҐ]/.test(text)) return 'ukrainian';
        if (/[áéíóúñ¿¡]/.test(text)) return 'spanish';
        return 'english';
    };

    const generateContent = async (field) => {
        if (!formData.name) {
            toast.error('Fill in the name to generate content');
            return;
        }

        setGeneratingContent(prev => ({ ...prev, [field]: true }));
        try {
            let prompt = '';
            let jsonSchema = {};
            const existingText = formData[field];

            // Detect language from existing text
            const detectedLang = detectLanguage(existingText);
            const languageInstruction = detectedLang === 'russian' ? 'Write in Russian language.' :
                detectedLang === 'ukrainian' ? 'Write in Ukrainian language.' :
                    detectedLang === 'spanish' ? 'Write in Spanish language.' :
                        'Write in English language.';

            if (field === 'description') {
                if (existingText && existingText.trim()) {
                    prompt = `You are a professional copywriter and content editor. Improve and enhance the following description for "${formData.name}" - a ${formData.type} in ${formData.city}, ${formData.country}.
                    
Current description: "${existingText}"

Rewrite it to be more compelling, engaging, and professional (2-3 sentences). Make it enticing and highlight what makes this place special. Keep the same tone and key information, but make it better written and more attractive. ${languageInstruction}`;
                } else {
                    prompt = `Write a compelling, engaging description (2-3 sentences) for "${formData.name}" - a ${formData.type} in ${formData.city}, ${formData.country}. 
Make it enticing and highlight what makes this place special. Write in Russian language.`;
                }
                jsonSchema = {
                    type: "object",
                    properties: { description: { type: "string" } }
                };
            } else if (field === 'insider_tip') {
                if (existingText && existingText.trim()) {
                    prompt = `You are a professional copywriter and content editor. Improve and enhance the following insider tip for "${formData.name}" in ${formData.city}, ${formData.country}.
                    
Current tip: "${existingText}"

Rewrite it to be more engaging and sound like advice from a knowledgeable local friend (1-2 sentences). Keep the essence but make it more compelling and natural. ${languageInstruction}`;
                } else {
                    prompt = `Write an insider tip (1-2 sentences) for "${formData.name}" in ${formData.city}, ${formData.country}. 
Include local secrets, best time to visit, or hidden menu items. Make it feel like advice from a local friend. Write in Russian language.`;
                }
                jsonSchema = {
                    type: "object",
                    properties: { insider_tip: { type: "string" } }
                };
            } else if (field === 'must_try') {
                if (existingText && existingText.trim()) {
                    prompt = `You are a professional copywriter and content editor. Improve and enhance the following recommendation for "${formData.name}" (a ${formData.type} in ${formData.city}).
                    
Current recommendation: "${existingText}"

Rewrite it to be more enticing and specific. Keep it short but make it sound more appetizing and compelling. ${languageInstruction}`;
                } else {
                    prompt = `What is the signature dish or must-try item at "${formData.name}" (a ${formData.type} in ${formData.city})? 
Provide a short, specific recommendation (just the dish name and brief description). Write in Russian language.`;
                }
                jsonSchema = {
                    type: "object",
                    properties: { must_try: { type: "string" } }
                };
            }

            const result = await base44.integrations.Core.InvokeLLM({
                prompt,
                add_context_from_internet: !existingText || !existingText.trim(),
                response_json_schema: jsonSchema
            });

            if (result && result[field]) {
                setFormData(prev => ({ ...prev, [field]: result[field] }));
                toast.success(existingText ? 'Text improved!' : 'Content generated!');
            }
        } catch (error) {
            console.error(error);
            toast.error('Content generation error');
        } finally {
            setGeneratingContent(prev => ({ ...prev, [field]: false }));
        }
    };

    // City & Country normalization map - ensures English names for UI while keeping local addresses for maps
    const normalizationMap = {
        // Polish cities
        'warszawa': 'Warsaw',
        'warsawa': 'Warsaw',
        'krakow': 'Krakow',
        'kraków': 'Krakow',
        'cracow': 'Krakow',
        'gdansk': 'Gdansk',
        'gdańsk': 'Gdansk',
        'danzig': 'Gdansk',
        'wroclaw': 'Wroclaw',
        'wrocław': 'Wroclaw',
        'breslau': 'Wroclaw',
        'poznan': 'Poznan',
        'poznań': 'Poznan',
        'lodz': 'Lodz',
        'łódź': 'Lodz',
        'szczecin': 'Szczecin',
        'bydgoszcz': 'Bydgoszcz',
        'lublin': 'Lublin',
        'katowice': 'Katowice',
        // Czech cities
        'praha': 'Prague',
        'prague': 'Prague',
        'brno': 'Brno',
        // Austrian cities
        'wien': 'Vienna',
        'vienna': 'Vienna',
        'salzburg': 'Salzburg',
        'innsbruck': 'Innsbruck',
        // Hungarian cities
        'budapest': 'Budapest',
        // Romanian cities
        'bucuresti': 'Bucharest',
        'bucharest': 'Bucharest',
        'cluj-napoca': 'Cluj-Napoca',
        'timisoara': 'Timisoara',
        'timișoara': 'Timisoara',
        // Ukrainian cities
        'kyiv': 'Kyiv',
        'kiev': 'Kyiv',
        'lviv': 'Lviv',
        'lvov': 'Lviv',
        'odesa': 'Odesa',
        'odessa': 'Odesa',
        'kharkiv': 'Kharkiv',
        'kharkov': 'Kharkiv',
        // Russian cities
        'moskva': 'Moscow',
        'moskwa': 'Moscow',
        'moscow': 'Moscow',
        'sankt-peterburg': 'Saint Petersburg',
        'st petersburg': 'Saint Petersburg',
        'sankt peterburg': 'Saint Petersburg',
        // Portuguese cities
        'lisboa': 'Lisbon',
        'lisbon': 'Lisbon',
        'porto': 'Porto',
        // Spanish cities
        'barcelona': 'Barcelona',
        'madrid': 'Madrid',
        'sevilla': 'Seville',
        'seville': 'Seville',
        'valencia': 'Valencia',
        // German cities
        'berlin': 'Berlin',
        'munchen': 'Munich',
        'münchen': 'Munich',
        'munich': 'Munich',
        'hamburg': 'Hamburg',
        'koln': 'Cologne',
        'köln': 'Cologne',
        'cologne': 'Cologne',
        'frankfurt': 'Frankfurt',
        // Italian cities
        'roma': 'Rome',
        'rome': 'Rome',
        'milano': 'Milan',
        'milan': 'Milan',
        'venezia': 'Venice',
        'venice': 'Venice',
        'firenze': 'Florence',
        'florence': 'Florence',
        'napoli': 'Naples',
        'naples': 'Naples',
        // French cities
        'paris': 'Paris',
        'marseille': 'Marseille',
        'lyon': 'Lyon',
        // Countries
        'polska': 'Poland',
        'poland': 'Poland',
        'czechia': 'Czech Republic',
        'ceska republika': 'Czech Republic',
        'česká republika': 'Czech Republic',
        'czech republic': 'Czech Republic',
        'osterreich': 'Austria',
        'österreich': 'Austria',
        'austria': 'Austria',
        'magyarorszag': 'Hungary',
        'magyarország': 'Hungary',
        'hungary': 'Hungary',
        'romania': 'Romania',
        'românia': 'Romania',
        'ukraina': 'Ukraine',
        'ukraine': 'Ukraine',
        'україна': 'Ukraine',
        'rossiya': 'Russia',
        'russia': 'Russia',
        'россия': 'Russia',
        'portugal': 'Portugal',
        'espana': 'Spain',
        'españa': 'Spain',
        'spain': 'Spain',
        'deutschland': 'Germany',
        'germany': 'Germany',
        'italia': 'Italy',
        'italy': 'Italy',
        'france': 'France',
        'francia': 'France',
    };

    const normalizeCityName = (name) => {
        if (!name) return name;
        const normalized = normalizationMap[name.toLowerCase()];
        return normalized || name;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user) {
            toast.error('Please sign in to add a location');
            base44.auth.redirectToLogin(window.location.href);
            return;
        }

        if (!formData.name || !formData.type || !formData.country || !formData.city) {
            toast.error('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);
        try {
            // Parse and normalize tags through AI
            let normalizedTags = [];
            const rawTags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);

            if (rawTags.length > 0) {
                try {
                    toast.info('Optimizing tags...');
                    const tagsResponse = await base44.functions.invoke('normalizeTags', {
                        tags: rawTags
                    });
                    if (tagsResponse.data?.normalizedTags) {
                        normalizedTags = tagsResponse.data.normalizedTags;
                        toast.success(`Tags optimized: ${normalizedTags.length} tags`);
                    }
                } catch (error) {
                    console.error('Tag normalization error:', error);
                    toast.warning('Could not optimize tags, using originals');
                    normalizedTags = rawTags;
                }
            }

            // Normalize city and country names before submission (English format for UI, local format stays in address)
            const normalizedCity = normalizeCityName(formData.city);
            const normalizedCountry = normalizeCityName(formData.country);
            const dataToSubmit = {
                ...formData,
                city: normalizedCity,
                country: normalizedCountry,
                tags: normalizedTags,
                special_labels: formData.special_labels || []
            };
            // CRITICAL: Auto-translate ALL Russian content to English (regardless if editing or new)
            let translatedData = { ...dataToSubmit };

            // Build fields array - translate ANY field with Russian characters
            const fieldsToTranslate = [];

            // Check each field - if it contains Russian, translate it
            if (dataToSubmit.description?.trim() && /[а-яА-ЯёЁ]/.test(dataToSubmit.description)) {
                fieldsToTranslate.push({ field: 'description', text: dataToSubmit.description });
            }
            if (dataToSubmit.insider_tip?.trim() && /[а-яА-ЯёЁ]/.test(dataToSubmit.insider_tip)) {
                fieldsToTranslate.push({ field: 'insider_tip', text: dataToSubmit.insider_tip });
            }
            if (dataToSubmit.must_try?.trim() && /[а-яА-ЯёЁ]/.test(dataToSubmit.must_try)) {
                fieldsToTranslate.push({ field: 'must_try', text: dataToSubmit.must_try });
            }
            if (dataToSubmit.opening_hours?.trim() && /[а-яА-ЯёЁ]/.test(dataToSubmit.opening_hours)) {
                fieldsToTranslate.push({ field: 'opening_hours', text: dataToSubmit.opening_hours });
            }

            if (fieldsToTranslate.length > 0) {
                toast.info('Translating new content to English...');

                const translationPrompt = `Translate the following location data from Russian to English with a LIVELY, HUMOROUS Instagram/Blog style. 

TONE REQUIREMENTS:
- Use casual, playful language with slang and abbreviations (AF, vibes, glow-up, pro tip, etc.)
- Make it fun and engaging like you're texting a friend
- Add humor and personality - be witty and entertaining
- Use short punchy sentences mixed with longer descriptive ones
- Feel free to use expressions like "score!", "pure magic", "channel your inner..."
- Make it sound exciting and irresistible

EXAMPLES OF THE DESIRED TONE:
"Craving solitude? Hit the hidden courtyard for sunny-day zen (warm weather glow-up). Basement's got a no-laptop zone during peak hours—pure unplug magic."
"Birthday bonus at this spot? Free dessert—score! Pro tip: Go wild on the animal desserts; skip the croissants."

Translate these fields:
${fieldsToTranslate.map(f => `${f.field}: "${f.text}"`).join('\n')}

Return format (keep the style fun and lively):
{
  "description": "translated description with humor and personality",
  "insider_tip": "translated tip in casual, fun style", 
  "must_try": "translated recommendation with excitement",
  "opening_hours": "translated opening hours (if provided)"
}`;

                const translation = await base44.integrations.Core.InvokeLLM({
                    prompt: translationPrompt,
                    response_json_schema: {
                        type: "object",
                        properties: {
                            description: { type: "string" },
                            insider_tip: { type: "string" },
                            must_try: { type: "string" },
                            opening_hours: { type: "string" }
                        }
                    }
                });

                // Always update English fields when translation happens
                translatedData.description_en = translation.description || dataToSubmit.description;
                translatedData.insider_tip_en = translation.insider_tip || dataToSubmit.insider_tip;
                translatedData.must_try_en = translation.must_try || dataToSubmit.must_try;
                translatedData.opening_hours = translation.opening_hours || dataToSubmit.opening_hours;
            }

            // Create main location (use first branch coordinates for backward compatibility)
            const mainBranch = branches[0];
            const createdLocation = await base44.entities.Location.create({
                ...translatedData,
                latitude: mainBranch.latitude ? parseFloat(mainBranch.latitude) : null,
                longitude: mainBranch.longitude ? parseFloat(mainBranch.longitude) : null,
                address: mainBranch.address || translatedData.address,
                phone: mainBranch.phone || translatedData.phone,
                opening_hours: mainBranch.opening_hours || translatedData.opening_hours,
                status: 'pending',
                created_by_name: user.full_name || user.email,
                is_hidden_gem: false,
                is_featured: false,
                special_labels: translatedData.special_labels,
                social_links: translatedData.social_links || []
            });

            // Create branches if multiple addresses
            if (branches.length > 0) {
                for (const branch of branches) {
                    if (branch.latitude && branch.longitude) {
                        await base44.entities.LocationBranch.create({
                            location_id: createdLocation.id,
                            branch_name: branch.branch_name || (branch.is_main ? 'Главный филиал' : ''),
                            address: branch.address,
                            latitude: parseFloat(branch.latitude),
                            longitude: parseFloat(branch.longitude),
                            phone: branch.phone || '',
                            opening_hours: branch.opening_hours || '',
                            is_main: branch.is_main || false
                        });
                    }
                }
            }

            toast.success('Location submitted for moderation!');
            setFormData({
                name: '',
                type: 'cafe',
                country: 'Poland',
                city: 'Warsaw',
                address: '',
                description: '',
                insider_tip: '',
                must_try: '',
                price_range: '$$',
                website: '',
                phone: '',
                opening_hours: '',
                booking_url: '',
                image_url: '',
                latitude: '',
                longitude: '',
                special_labels: [],
                social_links: []
            });
            setBranches([{
                id: Date.now(),
                branch_name: '',
                address: '',
                latitude: '',
                longitude: '',
                phone: '',
                opening_hours: '',
                is_main: true
            }]);
            setSocialLinkInput('');
            setSmartSearchQuery('');
            setSearchResults([]);
            setSelectedPlace(null);
            setShowResults(false);
            setTagsInput('');
            onSuccess();
        } catch (error) {
            console.error('Location submission error:', error);
            const errorMessage = error?.message || error?.toString() || 'Unknown error occurred';
            toast.error(`Submission failed: ${errorMessage}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <CreatorOnboardingGuide
                isOpen={showOnboarding}
                onComplete={handleOnboardingComplete}
                onSkip={handleOnboardingSkip}
            />
            <Dialog open={isOpen && !showOnboarding} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto dark:bg-neutral-800 dark:border-neutral-700">
                    <DialogHeader>
                        <DialogTitle className="text-neutral-900 dark:text-neutral-100">Add New Location</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Smart Search Section */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 p-4 rounded-xl border-0 shadow-sm dark:border dark:border-blue-900">
                            <Label className="text-neutral-900 dark:text-blue-200 font-semibold mb-2 block flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                Smart Fill
                            </Label>
                            <div className="space-y-2 relative">
                                <div className="relative">
                                    <Input
                                        placeholder='Start typing location name (e.g., "Blue Bottle Coffee, Warsaw")'
                                        value={smartSearchQuery}
                                        onChange={(e) => {
                                            setSmartSearchQuery(e.target.value);
                                            setSelectedPlace(null);
                                        }}
                                        className="bg-white text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 border-blue-200 dark:border-blue-800 focus-visible:ring-blue-500 w-full pr-8"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && selectedPlace) {
                                                e.preventDefault();
                                                handleFillFromSelected();
                                            }
                                        }}
                                    />
                                    {isAutoSearching && (
                                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-blue-600" />
                                    )}
                                </div>

                                {/* Search Results Dropdown - appears automatically */}
                                {showResults && searchResults.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-neutral-800 rounded-lg border border-blue-200 dark:border-neutral-700 shadow-xl max-h-60 overflow-y-auto z-50">
                                        {searchResults.map((place, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => handleSelectPlace(place)}
                                                className="w-full text-left p-3 hover:bg-blue-50 dark:hover:bg-neutral-700 transition-colors border-b border-neutral-100 dark:border-neutral-700 last:border-b-0"
                                            >
                                                <p className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">{place.name}</p>
                                                <p className="text-xs text-neutral-700 dark:text-neutral-400 mt-0.5">{place.address}</p>
                                                {place.description && (
                                                    <p className="text-xs text-neutral-700 dark:text-neutral-500 mt-1 line-clamp-1">{place.description}</p>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <Button
                                    type="button"
                                    onClick={handleFillFromSelected}
                                    disabled={isSearching || !selectedPlace}
                                    className="bg-blue-600 hover:bg-blue-700 text-white w-full disabled:opacity-50"
                                >
                                    {isSearching ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <Wand2 className="w-4 h-4 mr-2" />
                                            Fill Selected
                                        </>
                                    )}
                                </Button>
                            </div>
                            <p className="text-xs text-neutral-900 dark:text-blue-400 mt-2">
                                {smartSearchQuery.length < 3
                                    ? 'Type at least 3 characters to search for locations'
                                    : selectedPlace
                                        ? 'Click "Fill Selected" to auto-fill all fields from multiple sources'
                                        : isAutoSearching
                                            ? 'Searching...'
                                            : showResults && searchResults.length > 0
                                                ? 'Select a location from the list above'
                                                : 'No results found, try different keywords'
                                }
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Label className="text-neutral-900 dark:text-neutral-300">Name *</Label>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <HelpCircle className="w-4 h-4 text-neutral-400 cursor-help" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="text-sm">Enter the full official name of the venue</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder='E.g., "Blue Bottle Coffee"'
                                    required
                                    className="text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700 dark:placeholder:text-neutral-500"
                                />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Label className="text-neutral-900 dark:text-neutral-300">Type</Label>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <HelpCircle className="w-4 h-4 text-neutral-400 cursor-help" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="text-sm">Select the main type for proper categorization</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                                    <SelectTrigger className="text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cafe">Cafe</SelectItem>
                                        <SelectItem value="bar">Bar</SelectItem>
                                        <SelectItem value="restaurant">Restaurant</SelectItem>
                                        <SelectItem value="market">Market</SelectItem>
                                        <SelectItem value="shop">Shop</SelectItem>
                                        <SelectItem value="bakery">Bakery</SelectItem>
                                        <SelectItem value="winery">Winery</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Branches Section */}
                        <div className="space-y-4 bg-neutral-50 dark:bg-neutral-900 p-4 rounded-xl">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Label className="text-neutral-900 dark:text-neutral-300 font-semibold">Филиалы / Адреса</Label>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <HelpCircle className="w-4 h-4 text-neutral-400 cursor-help" />
                                            </TooltipTrigger>
                                            <TooltipContent className="max-w-xs">
                                                <p className="text-sm">Если заведение имеет несколько адресов в городе (сеть), добавьте все филиалы с координатами</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setBranches([...branches, {
                                        id: Date.now(),
                                        branch_name: '',
                                        address: '',
                                        latitude: '',
                                        longitude: '',
                                        phone: '',
                                        opening_hours: '',
                                        is_main: false
                                    }])}
                                    className="text-xs"
                                >
                                    + Добавить филиал
                                </Button>
                            </div>

                            {branches.map((branch, idx) => (
                                <div key={branch.id} className="bg-white dark:bg-neutral-800 p-4 rounded-lg space-y-3 border border-neutral-200 dark:border-neutral-700">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                                            {branch.is_main ? '🏢 Главный филиал' : `📍 Филиал ${idx}`}
                                        </span>
                                        {branches.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setBranches(branches.filter(b => b.id !== branch.id))}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <div>
                                            <Label className="text-xs text-neutral-700 dark:text-neutral-400">Название филиала (опционально)</Label>
                                            <Input
                                                value={branch.branch_name}
                                                onChange={(e) => setBranches(branches.map(b =>
                                                    b.id === branch.id ? { ...b, branch_name: e.target.value } : b
                                                ))}
                                                placeholder='Например: "Центральный", "Старый город"'
                                                className="text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700 text-sm"
                                            />
                                        </div>

                                        <div>
                                            <Label className="text-xs text-neutral-700 dark:text-neutral-400">Адрес *</Label>
                                            <Input
                                                value={branch.address}
                                                onChange={(e) => setBranches(branches.map(b =>
                                                    b.id === branch.id ? { ...b, address: e.target.value } : b
                                                ))}
                                                placeholder='E.g., "ul. Nowy Świat 15, Warsaw"'
                                                className="text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700 text-sm"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <Label className="text-xs text-neutral-700 dark:text-neutral-400">Телефон</Label>
                                                <Input
                                                    value={branch.phone}
                                                    onChange={(e) => setBranches(branches.map(b =>
                                                        b.id === branch.id ? { ...b, phone: e.target.value } : b
                                                    ))}
                                                    placeholder="+48..."
                                                    className="text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700 text-sm"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs text-neutral-700 dark:text-neutral-400">Часы работы</Label>
                                                <Input
                                                    value={branch.opening_hours}
                                                    onChange={(e) => setBranches(branches.map(b =>
                                                        b.id === branch.id ? { ...b, opening_hours: e.target.value } : b
                                                    ))}
                                                    placeholder="9:00-22:00"
                                                    className="text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700 text-sm"
                                                />
                                            </div>
                                        </div>

                                        {/* Map for this branch */}
                                        <div>
                                            <Label className="text-xs text-neutral-700 dark:text-neutral-400 mb-1 block">
                                                Координаты (кликните на карте) *
                                            </Label>
                                            <div className="h-[200px] rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700">
                                                <MapContainer
                                                    key={`map-${branch.id}`}
                                                    center={branch.latitude && branch.longitude ? [branch.latitude, branch.longitude] : [52.2297, 21.0122]}
                                                    zoom={branch.latitude ? 14 : 11}
                                                    style={{ height: '100%', width: '100%' }}
                                                >
                                                    <TileLayer
                                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                    />
                                                    <LocationPicker
                                                        position={branch.latitude && branch.longitude ? [branch.latitude, branch.longitude] : null}
                                                        onLocationSelect={(latlng) => {
                                                            setBranches(branches.map(b =>
                                                                b.id === branch.id ? {
                                                                    ...b,
                                                                    latitude: latlng.lat,
                                                                    longitude: latlng.lng
                                                                } : b
                                                            ));
                                                        }}
                                                    />
                                                </MapContainer>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 mt-2">
                                                <Input
                                                    type="number"
                                                    step="any"
                                                    value={branch.latitude}
                                                    onChange={(e) => setBranches(branches.map(b =>
                                                        b.id === branch.id ? { ...b, latitude: e.target.value } : b
                                                    ))}
                                                    placeholder="Latitude"
                                                    className="font-mono text-xs text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700"
                                                />
                                                <Input
                                                    type="number"
                                                    step="any"
                                                    value={branch.longitude}
                                                    onChange={(e) => setBranches(branches.map(b =>
                                                        b.id === branch.id ? { ...b, longitude: e.target.value } : b
                                                    ))}
                                                    placeholder="Longitude"
                                                    className="font-mono text-xs text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Label className="text-neutral-900 dark:text-neutral-300">Description</Label>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <HelpCircle className="w-4 h-4 text-neutral-400 cursor-help" />
                                            </TooltipTrigger>
                                            <TooltipContent className="max-w-xs">
                                                <p className="text-sm font-semibold mb-1">🎯 Be specific!</p>
                                                <p className="text-xs mb-2">Mention atmosphere, signature dishes, and unique features.</p>
                                                <p className="text-xs italic">Example: "Cozy cafe with specialty coffee, homemade croissants, and outdoor seating. Famous for their cinnamon rolls and cappuccino art."</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => generateContent('description')}
                                                disabled={generatingContent.description || !formData.name}
                                                className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                            >
                                                {generatingContent.description ? (
                                                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                                ) : (
                                                    <Sparkles className="w-3 h-3 mr-1" />
                                                )}
                                                AI Generate
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p className="text-sm">AI will create a description based on the venue name and type</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Example: Cozy neighborhood cafe with vintage decor, serving specialty coffee and artisan pastries. Their signature lavender latte and croissants are Instagram-famous."
                                rows={3}
                                className="text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700 dark:placeholder:text-neutral-500"
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Label className="text-neutral-900 dark:text-neutral-300">Insider Tip</Label>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <HelpCircle className="w-4 h-4 text-neutral-400 cursor-help" />
                                            </TooltipTrigger>
                                            <TooltipContent className="max-w-xs">
                                                <p className="text-sm font-semibold mb-1">💡 Share local secrets!</p>
                                                <p className="text-xs mb-2">Best time to visit, hidden menu items, where to sit.</p>
                                                <p className="text-xs italic">Example: "Visit in the morning for fresh pastries, ask for the window seat with garden view, try their secret off-menu lavender latte."</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => generateContent('insider_tip')}
                                                disabled={generatingContent.insider_tip || !formData.name}
                                                className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                            >
                                                {generatingContent.insider_tip ? (
                                                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                                ) : (
                                                    <Sparkles className="w-3 h-3 mr-1" />
                                                )}
                                                AI Generate
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p className="text-sm">AI will create an insider tip for this place</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            <Textarea
                                value={formData.insider_tip}
                                onChange={(e) => setFormData({ ...formData, insider_tip: e.target.value })}
                                placeholder='Example: "Visit weekday mornings for a quiet workspace vibe. Ask for their secret off-menu matcha latte. The terrace opens at noon – perfect for sunny lunch dates."'
                                rows={2}
                                className="text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700 dark:placeholder:text-neutral-500"
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Label className="text-neutral-900 dark:text-neutral-300">Must Try</Label>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <HelpCircle className="w-4 h-4 text-neutral-400 cursor-help" />
                                            </TooltipTrigger>
                                            <TooltipContent className="max-w-xs">
                                                <p className="text-sm font-semibold mb-1">⭐ Be SPECIFIC!</p>
                                                <p className="text-xs mb-2">List exact signature dishes/drinks that define this place.</p>
                                                <p className="text-xs italic">Example: "Their pistachio croissant, cold brew on nitro, and seasonal fruit tart. Don't miss the Sunday brunch special."</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => generateContent('must_try')}
                                                disabled={generatingContent.must_try || !formData.name}
                                                className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                            >
                                                {generatingContent.must_try ? (
                                                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                                ) : (
                                                    <Sparkles className="w-3 h-3 mr-1" />
                                                )}
                                                AI Generate
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p className="text-sm">AI will suggest signature dishes for this place</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            <Input
                                value={formData.must_try}
                                onChange={(e) => setFormData({ ...formData, must_try: e.target.value })}
                                placeholder='Example: "Pistachio croissant, cold brew on nitro, seasonal fruit tart, Sunday brunch special"'
                                className="text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700 dark:placeholder:text-neutral-500"
                            />
                        </div>

                        <div className="space-y-4">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Label className="text-neutral-900 dark:text-neutral-300">Price Range</Label>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <HelpCircle className="w-4 h-4 text-neutral-400 cursor-help" />
                                            </TooltipTrigger>
                                            <TooltipContent className="max-w-xs">
                                                <p className="text-sm">$ - up to 10€ | $$ - 10-25€ | $$$ - 25-50€ | $$$$ - over 50€ per person</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                                <Select value={formData.price_range} onValueChange={(v) => setFormData({ ...formData, price_range: v })}>
                                    <SelectTrigger className="text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="$">$ - Budget</SelectItem>
                                        <SelectItem value="$$">$$ - Moderate</SelectItem>
                                        <SelectItem value="$$$">$$$ - Expensive</SelectItem>
                                        <SelectItem value="$$$$">$$$$ - Premium</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-neutral-900 dark:text-neutral-300">Website</Label>
                                <Input
                                    value={formData.website}
                                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                    placeholder="https://example.com"
                                    className="text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700 dark:placeholder:text-neutral-500"
                                />
                            </div>
                            <div>
                                <Label className="text-neutral-900 dark:text-neutral-300">Phone</Label>
                                <Input
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="+48 123 456 789"
                                    className="text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700 dark:placeholder:text-neutral-500"
                                />
                            </div>
                            <div>
                                <Label className="text-neutral-900 dark:text-neutral-300">Opening Hours</Label>
                                <Input
                                    value={formData.opening_hours}
                                    onChange={(e) => setFormData({ ...formData, opening_hours: e.target.value })}
                                    placeholder="Mon-Fri: 9:00-22:00, Sat-Sun: 10:00-23:00"
                                    className="text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700 dark:placeholder:text-neutral-500"
                                />
                            </div>
                            <div>
                                <Label className="text-neutral-900 dark:text-neutral-300">Booking URL</Label>
                                <Input
                                    value={formData.booking_url}
                                    onChange={(e) => setFormData({ ...formData, booking_url: e.target.value })}
                                    placeholder="https://booking-link.com"
                                    className="text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700 dark:placeholder:text-neutral-500"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Label className="text-neutral-900 dark:text-neutral-300">Image</Label>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <HelpCircle className="w-4 h-4 text-neutral-400 cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs">
                                            <p className="text-sm">Upload a quality photo of interior or exterior. Horizontal orientation works better.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <Input
                                        value={formData.image_url}
                                        onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                        placeholder="https://... or upload file below"
                                        className="text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700 dark:placeholder:text-neutral-500"
                                    />
                                    {formData.image_url && (
                                        <div className="w-10 h-10 rounded-md overflow-hidden shrink-0 border border-stone-200">
                                            <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;

                                            setUploadingImage(true);
                                            try {
                                                toast.info('Uploading image...');

                                                const { file_url } = await base44.integrations.Core.UploadFile({ file });

                                                setFormData(prev => ({ ...prev, image_url: file_url }));
                                                toast.success('Photo uploaded successfully!');
                                            } catch (error) {
                                                console.error(error);
                                                toast.error('Photo upload error: ' + (error.message || 'Unknown error'));
                                            } finally {
                                                setUploadingImage(false);
                                            }
                                        }}
                                        disabled={uploadingImage}
                                        className="flex-1"
                                    />
                                    {uploadingImage && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
                                </div>
                            </div>
                        </div>



                        {/* Social Links */}
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Label className="text-neutral-900 dark:text-neutral-300">Social Media Links</Label>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <HelpCircle className="w-4 h-4 text-neutral-400 cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs">
                                            <p className="text-sm">Add links to social media pages (Instagram, Facebook, etc.)</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            <div className="space-y-2">
                                <div className="flex gap-2">
                                    <Input
                                        value={socialLinkInput}
                                        onChange={(e) => setSocialLinkInput(e.target.value)}
                                        placeholder="https://instagram.com/..."
                                        className="flex-1 text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700 dark:placeholder:text-neutral-500"
                                    />
                                    <Button
                                        type="button"
                                        onClick={() => {
                                            if (socialLinkInput.trim() && socialLinkInput.startsWith('http')) {
                                                setFormData({
                                                    ...formData,
                                                    social_links: [...(formData.social_links || []), socialLinkInput.trim()]
                                                });
                                                setSocialLinkInput('');
                                            } else {
                                                toast.error('Please enter a valid URL');
                                            }
                                        }}
                                        className="shrink-0"
                                    >
                                        Add
                                    </Button>
                                </div>
                                {formData.social_links && formData.social_links.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {formData.social_links.map((link, idx) => (
                                            <div key={idx} className="bg-neutral-100 dark:bg-neutral-700 rounded-lg px-3 py-1.5 flex items-center gap-2 text-sm">
                                                <span className="truncate max-w-[200px] text-neutral-900 dark:text-neutral-100">{link}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setFormData({
                                                            ...formData,
                                                            social_links: formData.social_links.filter((_, i) => i !== idx)
                                                        });
                                                    }}
                                                    className="text-neutral-500 hover:text-red-600"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Tags - Free keywords */}
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Label className="text-neutral-900 dark:text-neutral-300">Tags (IMPORTANT for AI recommendations!)</Label>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <HelpCircle className="w-4 h-4 text-neutral-400 cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs">
                                            <p className="text-sm font-semibold mb-1">🏷️ Keywords boost visibility!</p>
                                            <p className="text-xs mb-2">Add 5-10 keywords describing unique features.</p>
                                            <p className="text-xs italic">Example: "homemade pastries", "best espresso", "vintage interior", "Instagram-worthy", "quiet workspace", "amazing tiramisu"</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            <Textarea
                                value={tagsInput}
                                onChange={(e) => setTagsInput(e.target.value)}
                                placeholder='Add keywords separated by commas: "specialty coffee, homemade desserts, cozy, quiet"'
                                rows={2}
                                className="text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700 dark:placeholder:text-neutral-500"
                            />
                            <p className="text-xs text-neutral-700 dark:text-neutral-400 mt-1">
                                💡 AI will check, translate, and optimize tags when you save
                            </p>
                        </div>

                        {/* Special Labels */}
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Label className="text-neutral-900 dark:text-neutral-300">Special Features (Select ALL that apply!)</Label>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <HelpCircle className="w-4 h-4 text-neutral-400 cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs">
                                            <p className="text-sm font-semibold mb-1">⚡ CRITICAL for AI Guide!</p>
                                            <p className="text-xs mb-2">These labels help users find this place through AI recommendations and filters.</p>
                                            <p className="text-xs italic">If a place has great desserts → SELECT "Tasty Desserts". Has live music? → SELECT "Live Music". More labels = more visitors!</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {specialLabels.sort((a, b) => a.label.localeCompare(b.label)).map(labelItem => (
                                    <Button
                                        key={labelItem.id}
                                        type="button"
                                        variant={formData.special_labels?.includes(labelItem.id) ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => {
                                            const current = formData.special_labels || [];
                                            if (current.includes(labelItem.id)) {
                                                setFormData({ ...formData, special_labels: current.filter(l => l !== labelItem.id) });
                                            } else {
                                                setFormData({ ...formData, special_labels: [...current, labelItem.id] });
                                            }
                                        }}
                                        className={`text-xs ${formData.special_labels?.includes(labelItem.id)
                                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                                : 'hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300'
                                            }`}
                                    >
                                        {labelItem.emoji} {labelItem.label}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Submit for Moderation
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}