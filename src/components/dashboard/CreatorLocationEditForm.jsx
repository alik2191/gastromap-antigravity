import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2, Sparkles, HelpCircle, X } from "lucide-react";
import { toast } from "sonner";
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { specialLabels } from '../constants';

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

export default function CreatorLocationEditForm({ isOpen, onOpenChange, locationId, user, onSuccess }) {
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
    const [socialLinkInput, setSocialLinkInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [generatingContent, setGeneratingContent] = useState({
        description: false,
        insider_tip: false,
        must_try: false
    });
    const [uploadingImage, setUploadingImage] = useState(false);
    const [tagsInput, setTagsInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Load location data when dialog opens
    useEffect(() => {
        if (isOpen && locationId) {
            loadLocationData();
        }
    }, [isOpen, locationId]);

    const loadLocationData = async () => {
        setIsLoading(true);
        try {
            const locations = await base44.entities.Location.filter({ id: locationId });
            if (locations.length > 0) {
                const location = locations[0];
                setFormData({
                    name: location.name || '',
                    type: location.type || 'cafe',
                    country: location.country || 'Poland',
                    city: location.city || 'Warsaw',
                    address: location.address || '',
                    description: location.description || '',
                    insider_tip: location.insider_tip || '',
                    must_try: location.must_try || '',
                    price_range: location.price_range || '$$',
                    website: location.website || '',
                    phone: location.phone || '',
                    opening_hours: location.opening_hours || '',
                    booking_url: location.booking_url || '',
                    image_url: location.image_url || '',
                    latitude: location.latitude || '',
                    longitude: location.longitude || '',
                    special_labels: location.special_labels || [],
                    social_links: location.social_links || [],
                    tags: location.tags || []
                });
                // Load tags as comma-separated string
                setTagsInput((location.tags || []).join(', '));
            }
        } catch (error) {
            console.error('Error loading location:', error);
            toast.error('Failed to load location data');
        } finally {
            setIsLoading(false);
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

    // City & Country normalization map
    const normalizationMap = {
        'warszawa': 'Warsaw', 'warsawa': 'Warsaw', 'krakow': 'Krakow', 'kraków': 'Krakow',
        'cracow': 'Krakow', 'gdansk': 'Gdansk', 'gdańsk': 'Gdansk', 'danzig': 'Gdansk',
        'wroclaw': 'Wroclaw', 'wrocław': 'Wroclaw', 'breslau': 'Wroclaw', 'poznan': 'Poznan',
        'poznań': 'Poznan', 'lodz': 'Lodz', 'łódź': 'Lodz', 'szczecin': 'Szczecin',
        'bydgoszcz': 'Bydgoszcz', 'lublin': 'Lublin', 'katowice': 'Katowice',
        'praha': 'Prague', 'prague': 'Prague', 'brno': 'Brno', 'wien': 'Vienna',
        'vienna': 'Vienna', 'salzburg': 'Salzburg', 'innsbruck': 'Innsbruck',
        'budapest': 'Budapest', 'bucuresti': 'Bucharest', 'bucharest': 'Bucharest',
        'cluj-napoca': 'Cluj-Napoca', 'timisoara': 'Timisoara', 'timișoara': 'Timisoara',
        'kyiv': 'Kyiv', 'kiev': 'Kyiv', 'lviv': 'Lviv', 'lvov': 'Lviv',
        'odesa': 'Odesa', 'odessa': 'Odesa', 'kharkiv': 'Kharkiv', 'kharkov': 'Kharkiv',
        'moskva': 'Moscow', 'moskwa': 'Moscow', 'moscow': 'Moscow',
        'sankt-peterburg': 'Saint Petersburg', 'st petersburg': 'Saint Petersburg',
        'sankt peterburg': 'Saint Petersburg', 'lisboa': 'Lisbon', 'lisbon': 'Lisbon',
        'porto': 'Porto', 'barcelona': 'Barcelona', 'madrid': 'Madrid',
        'sevilla': 'Seville', 'seville': 'Seville', 'valencia': 'Valencia',
        'berlin': 'Berlin', 'munchen': 'Munich', 'münchen': 'Munich', 'munich': 'Munich',
        'hamburg': 'Hamburg', 'koln': 'Cologne', 'köln': 'Cologne', 'cologne': 'Cologne',
        'frankfurt': 'Frankfurt', 'roma': 'Rome', 'rome': 'Rome', 'milano': 'Milan',
        'milan': 'Milan', 'venezia': 'Venice', 'venice': 'Venice', 'firenze': 'Florence',
        'florence': 'Florence', 'napoli': 'Naples', 'naples': 'Naples', 'paris': 'Paris',
        'marseille': 'Marseille', 'lyon': 'Lyon', 'polska': 'Poland', 'poland': 'Poland',
        'czechia': 'Czech Republic', 'ceska republika': 'Czech Republic',
        'česká republika': 'Czech Republic', 'czech republic': 'Czech Republic',
        'osterreich': 'Austria', 'österreich': 'Austria', 'austria': 'Austria',
        'magyarorszag': 'Hungary', 'magyarország': 'Hungary', 'hungary': 'Hungary',
        'romania': 'Romania', 'românia': 'Romania', 'ukraina': 'Ukraine',
        'ukraine': 'Ukraine', 'україна': 'Ukraine', 'rossiya': 'Russia',
        'russia': 'Russia', 'россия': 'Russia', 'portugal': 'Portugal',
        'espana': 'Spain', 'españa': 'Spain', 'spain': 'Spain',
        'deutschland': 'Germany', 'germany': 'Germany', 'italia': 'Italy',
        'italy': 'Italy', 'france': 'France', 'francia': 'France',
    };

    const normalizeCityName = (name) => {
        if (!name) return name;
        const normalized = normalizationMap[name.toLowerCase()];
        return normalized || name;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!user) {
            toast.error('Please sign in to edit location');
            base44.auth.redirectToLogin(window.location.href);
            return;
        }

        if (!formData.name || !formData.type || !formData.country || !formData.city) {
            toast.error('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);
        try {
            // Parse and normalize tags through AI if changed
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

            // Normalize city and country names
            const normalizedCity = normalizeCityName(formData.city);
            const normalizedCountry = normalizeCityName(formData.country);
            const dataToSubmit = {
                ...formData,
                city: normalizedCity,
                country: normalizedCountry,
                tags: normalizedTags,
                special_labels: formData.special_labels || []
            };

            // CRITICAL: Auto-translate ALL Russian content to English
            let translatedData = { ...dataToSubmit };
            
            // Build fields array - translate ANY field with Russian characters
            const fieldsToTranslate = [];
            
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
                toast.info('Translating content to English...');
                
                const translationPrompt = `Translate the following location data from Russian to English with a LIVELY, HUMOROUS Instagram/Blog style. 

TONE REQUIREMENTS:
- Use casual, playful language with slang and abbreviations (AF, vibes, glow-up, pro tip, etc.)
- Make it fun and engaging like you're texting a friend
- Add humor and personality - be witty and entertaining
- Use short punchy sentences mixed with longer descriptive ones
- Feel free to use expressions like "score!", "pure magic", "channel your inner..."
- Make it sound exciting and irresistible

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

                // Update English fields
                translatedData.description_en = translation.description || dataToSubmit.description;
                translatedData.insider_tip_en = translation.insider_tip || dataToSubmit.insider_tip;
                translatedData.must_try_en = translation.must_try || dataToSubmit.must_try;
                translatedData.opening_hours = translation.opening_hours || dataToSubmit.opening_hours;
            }

            // Update location
            await base44.entities.Location.update(locationId, {
                ...translatedData,
                latitude: translatedData.latitude ? parseFloat(translatedData.latitude) : null,
                longitude: translatedData.longitude ? parseFloat(translatedData.longitude) : null,
                special_labels: translatedData.special_labels,
                social_links: translatedData.social_links || []
            });

            toast.success('Location updated successfully!');
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error('Location update error:', error);
            const errorMessage = error?.message || error?.toString() || 'Unknown error occurred';
            toast.error(`Update failed: ${errorMessage}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto dark:bg-neutral-800 dark:border-neutral-700">
                <DialogHeader>
                    <DialogTitle className="text-neutral-900 dark:text-neutral-100">Edit Location</DialogTitle>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex items-center justify-center p-8">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-neutral-900 dark:text-neutral-300">Name *</Label>
                                <Input 
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    placeholder='E.g., "Blue Bottle Coffee"'
                                    required
                                    className="text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700"
                                />
                            </div>
                            <div>
                                <Label className="text-neutral-900 dark:text-neutral-300">Type</Label>
                                <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
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

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-neutral-900 dark:text-neutral-300">Country *</Label>
                                <Input 
                                    value={formData.country}
                                    onChange={(e) => setFormData({...formData, country: e.target.value})}
                                    required
                                    className="text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700"
                                />
                            </div>
                            <div>
                                <Label className="text-neutral-900 dark:text-neutral-300">City *</Label>
                                <Input 
                                    value={formData.city}
                                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                                    required
                                    className="text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700"
                                />
                            </div>
                        </div>

                        <div>
                            <Label className="text-neutral-900 dark:text-neutral-300">Address *</Label>
                            <Input 
                                value={formData.address}
                                onChange={(e) => setFormData({...formData, address: e.target.value})}
                                required
                                className="text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700"
                            />
                        </div>

                        {/* Map for coordinates */}
                        <div>
                            <Label className="text-neutral-900 dark:text-neutral-300 mb-2 block">
                                Coordinates (click on map) *
                            </Label>
                            <div className="h-[200px] rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700">
                                <MapContainer 
                                    center={formData.latitude && formData.longitude ? [formData.latitude, formData.longitude] : [52.2297, 21.0122]} 
                                    zoom={formData.latitude ? 14 : 11} 
                                    style={{ height: '100%', width: '100%' }}
                                >
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                    <LocationPicker 
                                        position={formData.latitude && formData.longitude ? [formData.latitude, formData.longitude] : null}
                                        onLocationSelect={(latlng) => {
                                            setFormData({
                                                ...formData,
                                                latitude: latlng.lat,
                                                longitude: latlng.lng
                                            });
                                        }}
                                    />
                                </MapContainer>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                <Input 
                                    type="number"
                                    step="any"
                                    value={formData.latitude}
                                    onChange={(e) => setFormData({...formData, latitude: e.target.value})}
                                    placeholder="Latitude"
                                    className="font-mono text-xs text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100"
                                />
                                <Input 
                                    type="number"
                                    step="any"
                                    value={formData.longitude}
                                    onChange={(e) => setFormData({...formData, longitude: e.target.value})}
                                    placeholder="Longitude"
                                    className="font-mono text-xs text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <Label className="text-neutral-900 dark:text-neutral-300">Description</Label>
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
                                    AI Improve
                                </Button>
                            </div>
                            <Textarea 
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                rows={3}
                                className="text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700"
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <Label className="text-neutral-900 dark:text-neutral-300">Insider Tip</Label>
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
                                    AI Improve
                                </Button>
                            </div>
                            <Textarea 
                                value={formData.insider_tip}
                                onChange={(e) => setFormData({...formData, insider_tip: e.target.value})}
                                rows={2}
                                className="text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700"
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <Label className="text-neutral-900 dark:text-neutral-300">Must Try</Label>
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
                                    AI Improve
                                </Button>
                            </div>
                            <Input 
                                value={formData.must_try}
                                onChange={(e) => setFormData({...formData, must_try: e.target.value})}
                                className="text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-neutral-900 dark:text-neutral-300">Price Range</Label>
                                <Select value={formData.price_range} onValueChange={(v) => setFormData({...formData, price_range: v})}>
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
                                <Label className="text-neutral-900 dark:text-neutral-300">Phone</Label>
                                <Input 
                                    value={formData.phone}
                                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                    className="text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700"
                                />
                            </div>
                        </div>

                        <div>
                            <Label className="text-neutral-900 dark:text-neutral-300">Opening Hours</Label>
                            <Input 
                                value={formData.opening_hours}
                                onChange={(e) => setFormData({...formData, opening_hours: e.target.value})}
                                className="text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700"
                            />
                        </div>

                        <div>
                            <Label className="text-neutral-900 dark:text-neutral-300">Website</Label>
                            <Input 
                                value={formData.website}
                                onChange={(e) => setFormData({...formData, website: e.target.value})}
                                className="text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700"
                            />
                        </div>

                        <div>
                            <Label className="text-neutral-900 dark:text-neutral-300">Booking URL</Label>
                            <Input 
                                value={formData.booking_url}
                                onChange={(e) => setFormData({...formData, booking_url: e.target.value})}
                                className="text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700"
                            />
                        </div>

                        <div>
                            <Label className="text-neutral-900 dark:text-neutral-300 mb-2 block">Image</Label>
                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <Input 
                                        value={formData.image_url}
                                        onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                                        placeholder="https://..."
                                        className="text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700"
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
                                                setFormData(prev => ({...prev, image_url: file_url}));
                                                toast.success('Photo uploaded!');
                                            } catch (error) {
                                                toast.error('Upload error: ' + (error.message || 'Unknown error'));
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
                            <Label className="text-neutral-900 dark:text-neutral-300 mb-2 block">Social Media Links</Label>
                            <div className="space-y-2">
                                <div className="flex gap-2">
                                    <Input 
                                        value={socialLinkInput}
                                        onChange={(e) => setSocialLinkInput(e.target.value)}
                                        placeholder="https://instagram.com/..."
                                        className="flex-1 text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700"
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

                        {/* Tags */}
                        <div>
                            <Label className="text-neutral-900 dark:text-neutral-300 mb-2 block">Tags</Label>
                            <Textarea
                                value={tagsInput}
                                onChange={(e) => setTagsInput(e.target.value)}
                                placeholder='Separate with commas: "specialty coffee, cozy, quiet"'
                                rows={2}
                                className="text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700"
                            />
                            <p className="text-xs text-neutral-700 dark:text-neutral-400 mt-1">
                                💡 AI will optimize tags when you save
                            </p>
                        </div>

                        {/* Special Labels */}
                        <div>
                            <Label className="text-neutral-900 dark:text-neutral-300 mb-2 block">Special Features</Label>
                            <div className="flex flex-wrap gap-2">
                                {specialLabels.sort((a, b) => a.label.localeCompare(b.label)).map(labelItem => (
                                    <Button
                                        key={labelItem.id}
                                        type="button"
                                        variant={formData.special_labels?.includes(labelItem.id) ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => {
                                            const current = formData.special_labels || [];
                                            if (current.includes(labelItem.id)) {
                                                setFormData({...formData, special_labels: current.filter(l => l !== labelItem.id)});
                                            } else {
                                                setFormData({...formData, special_labels: [...current, labelItem.id]});
                                            }
                                        }}
                                        className={`text-xs ${
                                            formData.special_labels?.includes(labelItem.id) 
                                                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                                : 'hover:bg-blue-50 hover:text-blue-600'
                                        }`}
                                    >
                                        {labelItem.emoji} {labelItem.label}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Save Changes
                        </Button>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}