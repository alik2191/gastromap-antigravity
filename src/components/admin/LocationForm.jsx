import React, { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Wand2, Loader2, Sparkles, Copy, CheckCircle2, X, Archive, MapPin, Trash2, Plus, Info } from "lucide-react";
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { format } from "date-fns";
import { ru } from "date-fns/locale";

// Fix for default marker icon issue with Leaflet and Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

function LocationPicker({ position, onLocationSelect }) {
    const map = useMapEvents({
        click(e) {
            onLocationSelect(e.latlng);
        },
    });

    useEffect(() => {
        if (position) {
            map.setView(position, map.getZoom());
        }
    }, [position, map]);

    return position === null ? null : (
        <Marker position={position}></Marker>
    );
}

export default function LocationForm({ location, onSubmit, isLoading }) {
    const [formData, setFormData] = useState({
        name: location?.name || '',
        type: location?.type || 'cafe',
        country: location?.country || '',
        city: location?.city || '',
        address: location?.address || '',
        description: location?.description || '',
        insider_tip: location?.insider_tip || '',
        must_try: location?.must_try || '',
        price_range: location?.price_range || '$$',
        website: location?.website || '',
        phone: location?.phone || '',
        opening_hours: location?.opening_hours || '',
        booking_url: location?.booking_url || '',
        image_url: location?.image_url || '',
        latitude: location?.latitude || '',
        longitude: location?.longitude || '',
        is_hidden_gem: location?.is_hidden_gem || false,
        is_featured: location?.is_featured || false,
        special_labels: location?.special_labels || [],
        social_links: location?.social_links || [],
        best_time_to_visit: location?.best_time_to_visit || [],
        tags: location?.tags || []
    });
    const [branches, setBranches] = useState([{
        id: Date.now(),
        branch_name: '',
        address: location?.address || '',
        latitude: location?.latitude || '',
        longitude: location?.longitude || '',
        phone: location?.phone || '',
        opening_hours: location?.opening_hours || '',
        is_main: true
    }]);
    const [smartSearchQuery, setSmartSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [generatingContent, setGeneratingContent] = useState({
        description: false,
        insider_tip: false,
        must_try: false
    });
    const [uploadingImage, setUploadingImage] = useState(false);
    const [socialLinkInput, setSocialLinkInput] = useState('');
    const [tagsInput, setTagsInput] = useState(location?.tags?.join(', ') || '');

    // Fetch smart agents for dynamic prompts
    const { data: smartAgents = [] } = useQuery({
        queryKey: ['smart-agents'],
        queryFn: async () => {
            return await api.entities.AIAgent.list();
        }
    });

    const getAgentSystemPrompt = (key, fallback) => {
        const agent = smartAgents.find(a => a.key === key);
        return agent ? agent.system_prompt : fallback;
    };

    // Sync tags input when location changes
    useEffect(() => {
        setTagsInput(location?.tags?.join(', ') || '');
    }, [location?.id]);

    // Load existing branches when editing
    useEffect(() => {
        const loadBranches = async () => {
            if (location?.id) {
                try {
                    const existingBranches = await api.entities.LocationBranch.filter({ location_id: location.id });
                    if (existingBranches.length > 0) {
                        setBranches(existingBranches.map(b => ({
                            id: b.id,
                            branch_name: b.branch_name || '',
                            address: b.address,
                            latitude: b.latitude,
                            longitude: b.longitude,
                            phone: b.phone || '',
                            opening_hours: b.opening_hours || '',
                            is_main: b.is_main || false
                        })));
                    }
                } catch (error) {
                    console.error('Error loading branches:', error);
                }
            }
        };
        loadBranches();
    }, [location?.id]);

    const handleSmartSearch = async () => {
        if (!smartSearchQuery.trim()) return;
        setIsSearching(true);
        try {
            toast.info('Searching Google Places...');

            // Step 1: Fetch Hard Data from Google Places (via standard edge function)
            const googleResponse = await api.functions.invoke('search-google-places-detailed', {
                query: smartSearchQuery,
                language: 'en' // Force English as requested
            });

            if (!googleResponse.data || !googleResponse.data.found) {
                toast.error('Place not found on Google Maps');
                setIsSearching(false);
                return;
            }

            const p = googleResponse.data.place;
            toast.success('Found place! Fetching details...');

            // Prepare "Hard" Data
            const hardData = {
                name: p.name,
                address: p.address,
                phone: p.phone,
                website: p.website,
                rating: p.rating,
                opening_hours: p.opening_hours, // Text format
                price_level: p.price_level,
                latitude: p.latitude || 0,
                longitude: p.longitude || 0,
                google_maps_url: p.google_maps_url,
                // Map photos if needed
            };

            // Step 2: Ask Gemini to generate "Soft" Data based on Reviews
            toast.info('Analyzing reviews with AI...');

            const reviewsText = (p.reviews && p.reviews.length > 0)
                ? p.reviews.map(r => `"${r.text}" (Rating: ${r.rating})`).join('\n\n')
                : "No reviews available.";

            const systemInstruction = getAgentSystemPrompt('location_smart_fill', 'You are a gastronomic expert. Analyze the reviews...');

            const prompt = `Venue: "${p.name}" (${p.address})
Reviews:
${reviewsText}

Analyze these reviews and generate the requested JSON fields based on the system instructions.`;

            const aiResponse = await api.integrations.Core.InvokeLLM({
                prompt,
                system_instruction: systemInstruction,
                response_json_schema: {
                    type: "object",
                    properties: {
                        description: { type: "string" },
                        insider_tip: { type: "string" },
                        must_try: { type: "string" },
                        type: { type: "string" },
                        best_time_to_visit: { type: "array", items: { type: "string" } }
                    }
                }
            });

            // Merge Data
            const finalData = {
                ...hardData,
                description: aiResponse.description || p.name,
                insider_tip: aiResponse.insider_tip || "",
                must_try: aiResponse.must_try || "",
                type: aiResponse.type || "restaurant",
                best_time_to_visit: aiResponse.best_time_to_visit || [],

                // Track AI updates
                last_ai_update: new Date().toISOString(),
                ai_update_log: {
                    source: "Smart Fill",
                    reviews_analyzed: p.reviews ? p.reviews.length : 0,
                    timestamp: new Date().toISOString()
                }
            };

            setFormData(prev => ({
                ...prev,
                ...finalData
            }));

            toast.success('Location data filled intelligently!');


        } catch (error) {
            console.error('Smart Fill Error:', error);

            // Show specific error message based on error type
            let errorMessage = 'Failed to Smart Fill location';
            if (error.type === 'api_key_error') {
                errorMessage = '🔑 AI service not configured. Please contact administrator.';
            } else if (error.type === 'quota_error') {
                errorMessage = '⚠️ AI quota exceeded. Please try again later.';
            } else if (error.message) {
                errorMessage = `❌ ${error.message}`;
            }

            toast.error(errorMessage);
        } finally {
            setIsSearching(false);
        }
    };

    const generateContent = async (field) => {
        if (!formData.name || !formData.city || !formData.country) {
            toast.error('Заполните название, город и страну для генерации');
            return;
        }

        setGeneratingContent(prev => ({ ...prev, [field]: true }));
        try {
            const existingText = formData[field];
            const systemInstruction = getAgentSystemPrompt('content_generator', 'You are an expert copywriter...');
            const languageInstruction = "Ensure the output is in English."; // Or detect language

            const prompt = `Task: Generate/Improve content for field "${field}".
Venue: "${formData.name}" (${formData.type} in ${formData.city}, ${formData.country}).
Current Text: "${existingText || ''}"
Language Instruction: ${languageInstruction}

Please generate the content for "${field}" following the system instructions.`;

            let jsonSchema = {};
            if (field === 'description') {
                jsonSchema = {
                    type: "object",
                    properties: { description: { type: "string" } }
                };
            } else if (field === 'insider_tip') {
                jsonSchema = {
                    type: "object",
                    properties: { insider_tip: { type: "string" } }
                };
            } else if (field === 'must_try') {
                jsonSchema = {
                    type: "object",
                    properties: { must_try: { type: "string" } }
                };
            }

            const result = await api.integrations.Core.InvokeLLM({
                prompt,
                system_instruction: systemInstruction,
                add_context_from_internet: !existingText || !existingText.trim(),
                response_json_schema: jsonSchema
            });

            if (result && result[field]) {
                setFormData(prev => ({ ...prev, [field]: result[field] }));
                toast.success(existingText ? 'Текст улучшен!' : 'Контент сгенерирован!');
            }
        } catch (error) {
            console.error(error);

            // Show specific error message based on error type
            let errorMessage = 'Ошибка генерации контента';
            if (error.type === 'api_key_error') {
                errorMessage = '🔑 AI сервис не настроен. Обратитесь к администратору.';
            } else if (error.type === 'quota_error') {
                errorMessage = '⚠️ Превышен лимит AI. Попробуйте позже.';
            } else if (error.message) {
                errorMessage = `❌ ${error.message}`;
            }

            toast.error(errorMessage);
        } finally {
            setGeneratingContent(prev => ({ ...prev, [field]: false }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Parse and normalize tags through AI
        let normalizedTags = [];
        const rawTags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);

        if (rawTags.length > 0) {
            try {
                toast.info('Проверка и оптимизация тегов...');
                const tagsResponse = await api.functions.invoke('normalizeTags', {
                    tags: rawTags
                });
                if (tagsResponse.data?.normalizedTags) {
                    normalizedTags = tagsResponse.data.normalizedTags;
                    toast.success(`Теги оптимизированы: ${normalizedTags.length} тегов`);
                }
            } catch (error) {
                console.error('Tag normalization error:', error);
                toast.warning('Не удалось оптимизировать теги, используем оригинальные');
                normalizedTags = rawTags;
            }
        }

        // Auto-translate Russian content to English if needed
        let translatedData = { ...formData, tags: normalizedTags };

        const needsTranslation = /[а-яА-ЯёЁ]/.test(formData.description || '') ||
            /[а-яА-ЯёЁ]/.test(formData.insider_tip || '') ||
            /[а-яА-ЯёЁ]/.test(formData.must_try || '') ||
            /[а-яА-ЯёЁ]/.test(formData.opening_hours || '');

        if (needsTranslation) {
            toast.info('Переводим текст на английский...');

            const fieldsToTranslate = [];
            if (formData.description?.trim()) fieldsToTranslate.push({ field: 'description', text: formData.description });
            if (formData.insider_tip?.trim()) fieldsToTranslate.push({ field: 'insider_tip', text: formData.insider_tip });
            if (formData.must_try?.trim()) fieldsToTranslate.push({ field: 'must_try', text: formData.must_try });
            if (formData.opening_hours?.trim()) fieldsToTranslate.push({ field: 'opening_hours', text: formData.opening_hours });

            if (fieldsToTranslate.length > 0) {
                const systemInstruction = getAgentSystemPrompt('translator', 'Translate the location data to English with a FRIENDLY, CASUAL tone...');

                const translationPrompt = `Translate these fields to English:
${fieldsToTranslate.map(f => `${f.field}: "${f.text}"`).join('\n')}

Follow the tone guidelines in the system instructions. Return valid JSON.`;

                const translation = await api.integrations.Core.InvokeLLM({
                    prompt: translationPrompt,
                    system_instruction: systemInstruction,
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

                translatedData = {
                    ...formData,
                    description_en: translation.description || formData.description,
                    insider_tip_en: translation.insider_tip || formData.insider_tip,
                    must_try_en: translation.must_try || formData.must_try,
                    opening_hours: translation.opening_hours || formData.opening_hours
                };
            }
        }

        // Update main location with first branch coordinates
        const mainBranch = branches[0];
        const submitData = {
            ...translatedData,
            id: location?.id,
            latitude: mainBranch.latitude ? parseFloat(mainBranch.latitude) : null,
            longitude: mainBranch.longitude ? parseFloat(mainBranch.longitude) : null,
            address: mainBranch.address || translatedData.address,
            social_links: translatedData.social_links || [],
            best_time_to_visit: translatedData.best_time_to_visit || [],
            tags: translatedData.tags || []
        };

        // First update/create the location
        onSubmit(submitData);

        // Then create/update branches if location exists
        if (location?.id && branches.length > 0) {
            try {
                // Delete existing branches and create new ones
                const existingBranches = await api.entities.LocationBranch.filter({ location_id: location.id });
                for (const eb of existingBranches) {
                    await api.entities.LocationBranch.delete(eb.id);
                }
                for (const branch of branches) {
                    await api.entities.LocationBranch.create({
                        ...branch,
                        id: undefined, // Create new ID
                        location_id: location.id
                    });
                }
            } catch (e) {
                console.error("Branch sync error:", e);
                toast.error("Ошибка синхронизации филиалов");
            }
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingImage(true);
        try {
            const uploadResult = await api.integrations.Core.UploadFile({ file });
            if (uploadResult.success) {
                setFormData(prev => ({ ...prev, image_url: uploadResult.url }));
                toast.success('Изображение загружено');
            } else {
                throw new Error('Upload failed');
            }
        } catch (error) {
            console.error('Upload Error:', error);
            toast.error('Ошибка загрузки изображения');
        } finally {
            setUploadingImage(false);
        }
    };

    // --- Branch Handlers ---
    const addBranch = () => {
        setBranches([...branches, {
            id: Date.now(),
            branch_name: '',
            address: formData.city || '',
            latitude: '',
            longitude: '',
            phone: '',
            opening_hours: '',
            is_main: false
        }]);
    };

    const updateBranch = (id, field, value) => {
        setBranches(branches.map(b => b.id === id ? { ...b, [field]: value } : b));
    };

    const removeBranch = (id) => {
        if (branches.length <= 1) {
            toast.error('Должен остаться хотя бы один филиал (основной)');
            return;
        }
        setBranches(branches.filter(b => b.id !== id));
    };

    const setMainBranch = (id) => {
        setBranches(branches.map(b => ({ ...b, is_main: b.id === id })));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex gap-4 items-end bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
                <div className="flex-1 space-y-2">
                    <Label className="text-blue-900 dark:text-blue-100 font-semibold flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Smart Fill (Google Places + AI)
                    </Label>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Название заведения, город (например: Cafe Nero, Krakow)"
                            value={smartSearchQuery}
                            onChange={(e) => setSmartSearchQuery(e.target.value)}
                            className="bg-white dark:bg-neutral-900"
                        />
                    </div>
                    <p className="text-[10px] text-blue-600 dark:text-blue-300">
                        Найдем адрес, фото, отзывы и сгенерируем описание, инсайдерские советы и "must try" блюда.
                    </p>
                </div>
                <Button type="button" onClick={handleSmartSearch} disabled={isSearching} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
                    {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                    Умный поиск
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div>
                        <Label>Название *</Label>
                        <Input
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Тип *</Label>
                            <Input
                                required
                                value={formData.type}
                                placeholder="cafe, restaurant, bar..."
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label>Ценовой диапазон</Label>
                            <Input
                                value={formData.price_range}
                                onChange={(e) => setFormData({ ...formData, price_range: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Страна *</Label>
                            <Input
                                required
                                value={formData.country}
                                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label>Город *</Label>
                            <Input
                                required
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <Label>Теги (через запятую)</Label>
                        <Input
                            value={tagsInput}
                            onChange={(e) => setTagsInput(e.target.value)}
                            placeholder="coffee, cozy, laptop-friendly, breakfast"
                        />
                        <p className="text-xs text-neutral-500 mt-1">
                            Теги будут автоматически проверены и нормализованы при сохранении.
                        </p>
                    </div>

                    <div>
                        <Label>Изображение (URL)</Label>
                        <div className="flex gap-2">
                            <Input
                                value={formData.image_url}
                                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                placeholder="https://..."
                            />
                            <div className="relative">
                                <input
                                    type="file"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={handleFileUpload}
                                    disabled={uploadingImage}
                                />
                                <Button type="button" variant="outline" size="icon" disabled={uploadingImage}>
                                    {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Branch Management */}
                    <div className="border border-neutral-200 dark:border-neutral-700 rounded-xl p-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-base font-semibold">Филиалы и Адреса</Label>
                            <Button type="button" variant="outline" size="sm" onClick={addBranch}>
                                <Plus className="w-4 h-4 mr-1" /> Добавить
                            </Button>
                        </div>

                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                            {branches.map((branch, index) => (
                                <Card key={branch.id} className={`border ${branch.is_main ? 'border-primary shadow-sm bg-primary/5' : 'border-neutral-200'} relative`}>
                                    {branches.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:bg-red-50 h-6 w-6"
                                            onClick={() => removeBranch(branch.id)}
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                    )}
                                    <CardContent className="p-3 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className={`w-4 h-4 rounded-full border flex items-center justify-center cursor-pointer ${branch.is_main ? 'border-primary bg-primary' : 'border-neutral-300'}`}
                                                onClick={() => setMainBranch(branch.id)}
                                            >
                                                {branch.is_main && <div className="w-2 h-2 bg-white rounded-full" />}
                                            </div>
                                            <span className="text-sm font-medium">
                                                {branch.is_main ? 'Основной филиал' : `Филиал #${index + 1}`}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <Input
                                                placeholder="Название (опционально)"
                                                value={branch.branch_name}
                                                onChange={(e) => updateBranch(branch.id, 'branch_name', e.target.value)}
                                                className="h-8 text-xs"
                                            />
                                            <Input
                                                placeholder="Адрес *"
                                                required
                                                value={branch.address}
                                                onChange={(e) => updateBranch(branch.id, 'address', e.target.value)}
                                                className="h-8 text-xs"
                                            />
                                            <Input
                                                placeholder="Телефон"
                                                value={branch.phone}
                                                onChange={(e) => updateBranch(branch.id, 'phone', e.target.value)}
                                                className="h-8 text-xs"
                                            />
                                            <Input
                                                placeholder="Часы работы"
                                                value={branch.opening_hours}
                                                onChange={(e) => updateBranch(branch.id, 'opening_hours', e.target.value)}
                                                className="h-8 text-xs"
                                            />
                                        </div>

                                        {/* Map for coordinates */}
                                        <div className="h-[150px] w-full rounded-md overflow-hidden border border-neutral-200 relative z-0">
                                            <MapContainer
                                                center={[parseFloat(branch.latitude) || 50.0647, parseFloat(branch.longitude) || 19.9450]}
                                                zoom={13}
                                                style={{ height: '100%', width: '100%' }}
                                            >
                                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                                <LocationPicker
                                                    position={branch.latitude && branch.longitude ? [branch.latitude, branch.longitude] : null}
                                                    onLocationSelect={(latlng) => {
                                                        updateBranch(branch.id, 'latitude', latlng.lat);
                                                        updateBranch(branch.id, 'longitude', latlng.lng);
                                                    }}
                                                />
                                            </MapContainer>
                                            <div className="absolute bottom-1 left-1 bg-white/80 dark:bg-black/80 text-[10px] px-2 py-0.5 rounded backdrop-blur z-[1000]">
                                                {branch.latitude ? `${parseFloat(branch.latitude).toFixed(4)}, ${parseFloat(branch.longitude).toFixed(4)}` : 'Click map to set'}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-8 py-2">
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="is_hidden_gem"
                                checked={formData.is_hidden_gem}
                                onCheckedChange={(checked) => setFormData({ ...formData, is_hidden_gem: checked })}
                            />
                            <Label htmlFor="is_hidden_gem" className="cursor-pointer flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                Hidden Gem
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="is_featured"
                                checked={formData.is_featured}
                                onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                            />
                            <Label htmlFor="is_featured" className="cursor-pointer flex items-center gap-1.5">
                                <Star className="w-3.5 h-3.5 text-primary" />
                                Featured
                            </Label>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="relative">
                        <div className="flex justify-between items-center mb-1.5">
                            <Label>Описание</Label>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs text-blue-600"
                                onClick={() => generateContent('description')}
                                disabled={generatingContent.description}
                            >
                                {generatingContent.description ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Wand2 className="w-3 h-3 mr-1" />}
                                AI Improve
                            </Button>
                        </div>
                        <Textarea
                            className="min-h-[120px]"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="relative">
                        <div className="flex justify-between items-center mb-1.5">
                            <Label>Insider Tip</Label>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs text-blue-600"
                                onClick={() => generateContent('insider_tip')}
                                disabled={generatingContent.insider_tip}
                            >
                                {generatingContent.insider_tip ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Wand2 className="w-3 h-3 mr-1" />}
                                AI Generate
                            </Button>
                        </div>
                        <Textarea
                            value={formData.insider_tip}
                            onChange={(e) => setFormData({ ...formData, insider_tip: e.target.value })}
                        />
                    </div>

                    <div className="relative">
                        <div className="flex justify-between items-center mb-1.5">
                            <Label>Must Try</Label>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs text-blue-600"
                                onClick={() => generateContent('must_try')}
                                disabled={generatingContent.must_try}
                            >
                                {generatingContent.must_try ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Wand2 className="w-3 h-3 mr-1" />}
                                AI Generate
                            </Button>
                        </div>
                        <Input
                            value={formData.must_try}
                            onChange={(e) => setFormData({ ...formData, must_try: e.target.value })}
                        />
                    </div>

                    <div>
                        <Label>Вебсайт</Label>
                        <Input
                            value={formData.website}
                            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                            placeholder="https://..."
                        />
                    </div>

                    <div>
                        <Label>Ссылка на бронирование</Label>
                        <Input
                            value={formData.booking_url}
                            onChange={(e) => setFormData({ ...formData, booking_url: e.target.value })}
                        />
                    </div>

                    <div>
                        <Label>Соцсети</Label>
                        <div className="flex gap-2">
                            <Input
                                value={socialLinkInput}
                                onChange={(e) => setSocialLinkInput(e.target.value)}
                                placeholder="Добавить ссылку (Instagram, TikTok...)"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        if (socialLinkInput.trim()) {
                                            setFormData(prev => ({
                                                ...prev,
                                                social_links: [...(prev.social_links || []), socialLinkInput.trim()]
                                            }));
                                            setSocialLinkInput('');
                                        }
                                    }
                                }}
                            />
                            <Button
                                type="button"
                                onClick={() => {
                                    if (socialLinkInput.trim()) {
                                        setFormData(prev => ({
                                            ...prev,
                                            social_links: [...(prev.social_links || []), socialLinkInput.trim()]
                                        }));
                                        setSocialLinkInput('');
                                    }
                                }}
                            >
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="mt-2 space-y-1">
                            {formData.social_links?.map((link, i) => (
                                <div key={i} className="flex justify-between items-center bg-stone-100 dark:bg-neutral-800 px-3 py-1 rounded text-sm">
                                    <span className="truncate flex-1 mr-2">{link}</span>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({
                                            ...prev,
                                            social_links: prev.social_links.filter((_, idx) => idx !== i)
                                        }))}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-6">
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            {location ? 'Сохранить изменения' : 'Создать локацию'}
                        </Button>
                    </div>
                </div>
            </div>
        </form>
    );
}
