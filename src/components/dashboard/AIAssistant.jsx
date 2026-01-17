import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
    Sparkles, Send, X, Loader2, MapPin, Star, DollarSign, 
    MessageCircle, ChevronDown, Map as MapIcon, Calendar, Route, Download
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import LocationCard from './LocationCard';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLanguage } from '../LanguageContext';

const typeLabels = {
    cafe: "Кафе",
    bar: "Бар",
    restaurant: "Ресторан",
    market: "Рынок",
    shop: "Магазин",
    bakery: "Пекарня",
    winery: "Винодельня"
};

export default function AIAssistant({ 
    allLocations, savedLocations, user, onSave, onUpdate,
    isOpen: externalIsOpen, onOpenChange: externalOnOpenChange, showFloatingButton = true,
    userLocation = null
}) {
    const { t } = useLanguage();
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const isControlled = typeof externalIsOpen !== 'undefined';
    const isOpen = isControlled ? externalIsOpen : internalIsOpen;
    const setIsOpen = isControlled ? externalOnOpenChange : setInternalIsOpen;
    const [conversationId, setConversationId] = useState(null);
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: "Hey! 👋 I'll help you find the perfect spot. What are you looking for - maybe a cozy cafe, cool bar, or restaurant with special vibes? Tell me the city, budget, mood - the more details, the better I can help!",
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [isLocationCardOpen, setIsLocationCardOpen] = useState(false);
    const messagesEndRef = useRef(null);
    const [historyLoaded, setHistoryLoaded] = useState(false);
    const [routeMode, setRouteMode] = useState(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Load chat history when component mounts
    useEffect(() => {
        const loadHistory = async () => {
            if (!user || historyLoaded) return;
            
            try {
                // Find or create conversation
                const conversations = await base44.entities.ChatMessage.filter({ 
                    user_email: user.email 
                });
                
                if (conversations.length > 0) {
                    // Load existing conversation
                    const convId = conversations[0].conversation_id;
                    setConversationId(convId);
                    
                    const history = await base44.entities.ChatMessage.filter({ 
                        conversation_id: convId 
                    });
                    
                    if (history.length > 0) {
                        const loadedMessages = history
                            .sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
                            .map(msg => ({
                                role: msg.role,
                                content: msg.content,
                                timestamp: new Date(msg.created_date),
                                recommendations: msg.location_data || undefined,
                                verifiedInfo: {}
                            }));
                        setMessages(loadedMessages);
                    }
                } else {
                    // Create new conversation ID
                    const newConvId = `conv_${user.email}_${Date.now()}`;
                    setConversationId(newConvId);
                }
                
                setHistoryLoaded(true);
            } catch (error) {
                console.error('Error loading chat history:', error);
                setHistoryLoaded(true);
            }
        };
        
        if (isOpen && user) {
            loadHistory();
        }
    }, [isOpen, user, historyLoaded]);

    // Save message to DB
    const saveMessageToDB = async (message, recommendations = null) => {
        if (!user || !conversationId) return;
        
        try {
            await base44.entities.ChatMessage.create({
                conversation_id: conversationId,
                user_email: user.email,
                role: message.role,
                content: message.content,
                location_data: recommendations
            });
        } catch (error) {
            console.error('Error saving message:', error);
        }
    };

    // Extract user preferences from conversation history
    const extractUserPreferences = () => {
        const userMessages = messages.filter(m => m.role === 'user').map(m => m.content);
        const mentionedTypes = [];
        const mentionedCities = [];
        const mentionedFeatures = [];
        
        userMessages.forEach(msg => {
            const lower = msg.toLowerCase();
            // Extract types
            if (lower.includes('cafe') || lower.includes('кафе') || lower.includes('coffee')) mentionedTypes.push('cafe');
            if (lower.includes('bar') || lower.includes('бар')) mentionedTypes.push('bar');
            if (lower.includes('restaurant') || lower.includes('ресторан')) mentionedTypes.push('restaurant');
            
            // Extract features
            if (lower.includes('cozy') || lower.includes('уютн')) mentionedFeatures.push('cozyRestaurant');
            if (lower.includes('romantic') || lower.includes('романтич')) mentionedFeatures.push('romanticSetting');
            if (lower.includes('wifi') || lower.includes('вай-фай')) mentionedFeatures.push('freeWifi');
            if (lower.includes('terrace') || lower.includes('outdoor') || lower.includes('терраса')) mentionedFeatures.push('outdoorSeating');
        });
        
        return {
            types: [...new Set(mentionedTypes)],
            features: [...new Set(mentionedFeatures)]
        };
    };

    // Generate calendar event (.ics file)
    const generateICS = (location, date = new Date()) => {
        const startDate = new Date(date);
        startDate.setHours(12, 0, 0);
        const endDate = new Date(startDate);
        endDate.setHours(14, 0, 0);
        
        const formatDate = (d) => {
            return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        };
        
        const icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//GastroMap//AI Guide//EN',
            'BEGIN:VEVENT',
            `UID:${Date.now()}@gastromap.com`,
            `DTSTAMP:${formatDate(new Date())}`,
            `DTSTART:${formatDate(startDate)}`,
            `DTEND:${formatDate(endDate)}`,
            `SUMMARY:Visit ${location.name}`,
            `DESCRIPTION:${location.description || 'Recommended by GastroMap AI'}`,
            `LOCATION:${location.address || `${location.city}, ${location.country}`}`,
            'END:VEVENT',
            'END:VCALENDAR'
        ].join('\r\n');
        
        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${location.name.replace(/[^a-z0-9]/gi, '_')}.ics`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(t('addedToCalendar') || 'Добавлено в календарь!');
    };

    const handleSendMessage = async () => {
        if (!input.trim() || loading) return;

        const userMessage = {
            role: 'user',
            content: input.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        saveMessageToDB(userMessage);
        setInput('');
        setLoading(true);

        // Check if this is a route planning request
        const isRouteRequest = /route|маршрут|plan|путь|itinerary/i.test(input);
        if (isRouteRequest) {
            setRouteMode(true);
        }

        try {
            // Extract preferences from conversation history
            const conversationPreferences = extractUserPreferences();
            // Add user location distances to locations data
            const locationsData = allLocations.map(l => {
                const baseData = {
                    id: l.id,
                    name: l.name,
                    type: l.type,
                    city: l.city,
                    country: l.country,
                    address: l.address,
                    description: l.description,
                    description_en: l.description_en,
                    price_range: l.price_range,
                    insider_tip: l.insider_tip,
                    insider_tip_en: l.insider_tip_en,
                    must_try: l.must_try,
                    must_try_en: l.must_try_en,
                    tags: l.tags || [],
                    special_labels: l.special_labels || [],
                    best_time_to_visit: l.best_time_to_visit || [],
                    is_hidden_gem: l.is_hidden_gem,
                    average_rating: l.average_rating,
                    reviews_count: l.reviews_count,
                    website: l.website,
                    opening_hours: l.opening_hours,
                    phone: l.phone
                };

                // Add distance if user location is available
                if (userLocation && l.latitude && l.longitude) {
                    const R = 6371;
                    const dLat = (l.latitude - userLocation.latitude) * Math.PI / 180;
                    const dLon = (l.longitude - userLocation.longitude) * Math.PI / 180;
                    const a = 
                        Math.sin(dLat/2) * Math.sin(dLat/2) +
                        Math.cos(userLocation.latitude * Math.PI / 180) * Math.cos(l.latitude * Math.PI / 180) *
                        Math.sin(dLon/2) * Math.sin(dLon/2);
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                    baseData.distance_km = Math.round(R * c * 10) / 10;
                }

                return baseData;
            });

            // Prepare user context with analysis
            const userWishlist = savedLocations
                .filter(s => s.list_type === 'wishlist')
                .map(s => allLocations.find(l => l.id === s.location_id))
                .filter(Boolean);
            
            const userVisited = savedLocations
                .filter(s => s.list_type === 'visited')
                .map(s => allLocations.find(l => l.id === s.location_id))
                .filter(Boolean);

            // Analyze user preferences
            const preferredTypes = [...new Set([...userWishlist, ...userVisited].map(l => l.type))];
            const preferredCities = [...new Set([...userWishlist, ...userVisited].map(l => l.city))];
            const preferredLabels = [...new Set([...userWishlist, ...userVisited].flatMap(l => l.special_labels || []))];

            const prompt = `You are a friendly guide helping people find perfect food & drink spots. Your tone is casual, warm, like chatting with a friend.

CRITICAL: Reply in the SAME LANGUAGE the user writes in (English, Russian, Spanish, etc.). Match their language exactly.

SCOPE: Answer ONLY questions about venues, restaurants, cafes, bars, and food/drink locations. If user asks about other topics (weather, news, general questions, etc.), politely remind them you only help with finding places to eat and drink.

ROUTE PLANNING MODE: ${isRouteRequest ? 'YES - User wants a route/itinerary with multiple places' : 'NO - Single recommendation mode'}

CONVERSATION MEMORY (preferences from chat history):
- User previously mentioned types: ${conversationPreferences.types.join(', ') || 'None'}
- User previously mentioned features: ${conversationPreferences.features.join(', ') || 'None'}
- Use this context to personalize recommendations even if not explicitly mentioned in current message

TIME-BASED PERSONALIZATION:
- Current time of day: ${(() => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 11) return 'УТРО (утро) - prioritize breakfast spots';
    if (hour >= 11 && hour < 18) return 'ДЕНЬ (день) - prioritize lunch/cafe spots';
    if (hour >= 18 && hour < 21) return 'ВЕЧЕР (вечер) - prioritize dinner/bars';
    return 'ПОЗДНЯЯ НОЧЬ (поздняя ночь) - prioritize late-night spots';
})()}
- IMPORTANT: Prioritize locations with matching best_time_to_visit array values and relevant special_labels
- For УТРО: prefer locations with special_labels containing "breakfastMenu" or "allDayBreakfast"
- For ДЕНЬ: prefer locations with special_labels containing "lunchMenu" or "businessLunch"
- For ВЕЧЕР/НОЧЬ: prefer locations with special_labels containing "lateDinner" or bars/restaurants

User's question: "${userMessage.content}"

Available locations database:
${JSON.stringify(locationsData, null, 2)}

User's wishlist:
${JSON.stringify(userWishlist.map(l => ({ name: l.name, type: l.type, city: l.city })), null, 2)}

Places user has visited:
${JSON.stringify(userVisited.map(l => ({ name: l.name, type: l.type, city: l.city })), null, 2)}

User Preferences Analysis:
- Preferred types: ${preferredTypes.join(', ') || 'Not enough data'}
- Preferred cities: ${preferredCities.join(', ') || 'Not enough data'}
- Preferred features: ${preferredLabels.slice(0, 5).join(', ') || 'Not enough data'}
${userLocation ? `- User's current location available: prioritize nearby places when relevant (use distance_km field)` : '- User location not available'}

MATCHING INSTRUCTIONS (CRITICAL for accuracy):
1. FIRST check if the question is about venues/food. If NOT - ask a clarifying question to understand what they're looking for
2. REPLY IN THE SAME LANGUAGE the user wrote in
3. PERSONALIZATION FIRST: Analyze user preferences from wishlist/visited and suggest similar places they might love

4. SEMANTIC MATCHING PRIORITY (most important):
   a) TIME OF DAY MATCH (NEW - HIGHEST PRIORITY): Filter and rank by current time:
      - Check best_time_to_visit array first - locations matching current time get HUGE boost
      - Check special_labels for time-relevant menus (breakfastMenu/lunchMenu/lateDinner)
      - For УТРО: ONLY show locations with "breakfastMenu" OR "allDayBreakfast" OR best_time_to_visit contains "утро"
      - For ДЕНЬ: prioritize "lunchMenu" OR "businessLunch" OR best_time_to_visit contains "день"
      - For ВЕЧЕР/НОЧЬ: prioritize bars, restaurants, "lateDinner" OR best_time_to_visit contains "вечер"/"поздняя ночь"
      - If NO time-matching locations found → fall back to user preferences
   b) LOCATION PROXIMITY: If user mentions "near me", "nearby", "close" → PRIORITIZE by distance_km (ascending)
   c) EXACT TYPE MATCH: If user asks for "cafe" → filter ONLY type="cafe". If "restaurant" → ONLY type="restaurant"
   d) LOCATION: Match city/country exactly (e.g., "Krakow" → filter city="Krakow")
   e) KEYWORDS & FEATURES: Search in description, insider_tip, must_try, tags, special_labels
   f) PRICE: If user mentions "cheap"/"budget" → prefer "$" or "$$". If "expensive"/"fancy" → "$$$" or "$$$$"
   g) RATING: Prefer locations with higher average_rating (4+) and more reviews_count
   h) POPULARITY: If user asks for "popular" or "best" → prioritize average_rating >= 4.5 AND reviews_count > 10

5. RANKING RULES:
   - Sort recommendations by: TIME OF DAY MATCH → DISTANCE (if relevant) → RATING → CONFIDENCE → REVIEWS COUNT
   - Give HIGH confidence ONLY if location matches ALL user criteria (time of day + type + city + special features)
   - Give MEDIUM confidence if matches time of day + type + city but some features missing
   - Give LOW confidence if approximate match or alternative suggestion
   - ALWAYS mention in your response why you're recommending these places based on current time

6. CLARIFYING QUESTIONS: If request is unclear (e.g., "something good"), ask 2-3 quick questions to narrow down:
   - What type of place? (cafe/bar/restaurant)
   - Which city/area?
   - Any specific preferences? (budget, vibe, features)

7. ONLINE CHECK: Request online verification for top 3 matches to get real-time info

8. ROUTE PLANNING: If user asks for a route/itinerary (e.g., "plan a route", "3 cafes in a row"):
   - Return 3-5 locations that are GEOGRAPHICALLY CLOSE to each other
   - Sort by proximity to create an optimal walking route
   - Mention estimated walking distances between stops
   - Include variety (different vibes/specialties) within the route

9. Response format: Give 3-5 recommendations, ranked by relevance. Be conversational and helpful.

10. If NO MATCHES: Suggest closest alternatives OR ask clarifying questions to understand better

Response format:
{
  "message": "Your brief friendly response (2-3 sentences max) OR clarifying question if needed",
  "is_clarifying_question": false,
  "is_route": false,
  "route_description": "If is_route=true, describe the route (e.g., 'Start at X, walk 5min to Y, then 10min to Z')",
  "need_online_check": true,
  "locations_to_check": ["location_name1", "location_name2"],
  "recommendations": [
    {
      "location_id": "id from database",
      "confidence": "high/medium/low",
      "reason": "why this matches user request",
      "order_in_route": 1
    }
  ]
}`;

            const result = await base44.integrations.Core.InvokeLLM({
                prompt,
                response_json_schema: {
                    type: "object",
                    properties: {
                        message: { type: "string" },
                        is_clarifying_question: { type: "boolean" },
                        is_route: { type: "boolean" },
                        route_description: { type: "string" },
                        need_online_check: { type: "boolean" },
                        locations_to_check: { 
                            type: "array",
                            items: { type: "string" }
                        },
                        recommendations: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    location_id: { type: "string" },
                                    confidence: { type: "string" },
                                    reason: { type: "string" },
                                    order_in_route: { type: "number" }
                                }
                            }
                        }
                    }
                }
            });

            // If it's a clarifying question, just show the message and wait for user response
            if (result.is_clarifying_question) {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: result.message,
                    timestamp: new Date()
                }]);
                saveMessageToDB({ role: 'assistant', content: result.message });
                setLoading(false);
                return;
            }

            // Check online if needed - use Google Places API for better accuracy
            let finalMessage = result.message;
            let verifiedInfo = {};

            if (result.need_online_check && result.locations_to_check?.length > 0) {
                for (const locationName of result.locations_to_check.slice(0, 3)) {
                    const location = allLocations.find(l => l.name === locationName);
                    if (location) {
                        try {
                            // Try Google Places API first
                            const googlePlacesResult = await base44.functions.invoke('searchGooglePlacesDetailed', {
                                query: location.name,
                                latitude: location.latitude,
                                longitude: location.longitude
                            });

                            if (googlePlacesResult.data?.found && googlePlacesResult.data?.place) {
                                const placeData = googlePlacesResult.data.place;
                                verifiedInfo[location.id] = {
                                    opening_hours: placeData.opening_hours,
                                    average_bill: placeData.price_level,
                                    popular_dishes: placeData.reviews?.length > 0 
                                        ? placeData.reviews.slice(0, 3).map(r => r.text.substring(0, 100)).join('; ')
                                        : 'Check reviews',
                                    website: placeData.website,
                                    phone: placeData.phone,
                                    google_rating: placeData.rating,
                                    google_reviews_count: placeData.reviews_count,
                                    google_maps_url: placeData.google_maps_url,
                                    verified: true
                                };
                            } else {
                                // Fallback to LLM with web search
                                const onlineCheck = await base44.integrations.Core.InvokeLLM({
                                    prompt: `Search for real-time information about: ${location.name} in ${location.city}, ${location.country}. Return structured data.`,
                                    add_context_from_internet: true,
                                    response_json_schema: {
                                        type: "object",
                                        properties: {
                                            opening_hours: { type: "string" },
                                            average_bill: { type: "string" },
                                            popular_dishes: { type: "string" },
                                            website: { type: "string" },
                                            verified: { type: "boolean" }
                                        }
                                    }
                                });
                                verifiedInfo[location.id] = onlineCheck;
                            }
                        } catch (e) {
                            console.error('Online check failed:', e);
                        }
                    }
                    }
            }

            // Create assistant response with recommendations
            const filteredRecommendations = result.recommendations?.filter(r => 
                allLocations.find(l => l.id === r.location_id)
            );
            
            const assistantMessage = {
                role: 'assistant',
                content: finalMessage,
                timestamp: new Date(),
                recommendations: filteredRecommendations,
                verifiedInfo,
                isRoute: result.is_route || false,
                routeDescription: result.route_description || null
            };

            setMessages(prev => [...prev, assistantMessage]);
            saveMessageToDB(assistantMessage, filteredRecommendations);

        } catch (error) {
            console.error('AI Assistant error:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Извините, произошла ошибка. Попробуйте переформулировать запрос.',
                timestamp: new Date()
            }]);
            toast.error('Ошибка при обработке запроса');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Calculate distance between two coordinates (Haversine formula)
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    };

    const getDistanceText = (location) => {
        if (!userLocation || !location.latitude || !location.longitude) return null;
        const distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            location.latitude,
            location.longitude
        );
        if (distance < 1) return `${Math.round(distance * 1000)}м`;
        return `${distance.toFixed(1)}км`;
    };

    return (
        <>
            {/* Floating Button */}
            <AnimatePresence>
                {!isOpen && showFloatingButton && (
                    <motion.button
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        onClick={() => setIsOpen(true)}
                        className="fixed bottom-6 right-6 md:bottom-8 md:right-8 w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-50"
                    >
                        <Sparkles className="w-7 h-7 text-white" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 100, scale: 0.9 }}
                        className="fixed top-[68px] left-0 right-0 bottom-16 md:bottom-8 md:right-8 md:top-auto md:left-auto md:w-[450px] md:h-[600px] bg-white dark:bg-neutral-800 md:rounded-3xl shadow-2xl flex flex-col z-50 overflow-hidden border-0 md:border md:border-purple-100 dark:md:border-neutral-700"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-3 md:p-5 flex items-center justify-between">
                            <div className="flex items-center gap-2 md:gap-3">
                                <div className="w-8 h-8 md:w-10 md:h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                                    <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white dark:text-white text-sm md:text-base">AI Guide</h3>
                                    <p className="text-[10px] md:text-xs text-white/80 dark:text-white/80">Find your perfect spot</p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsOpen(false)}
                                className="text-white hover:bg-white/20 rounded-full md:block hidden"
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gradient-to-b from-purple-50/30 to-white dark:from-neutral-900 dark:to-neutral-800">
                            {messages.map((message, index) => (
                                <div key={index}>
                                    <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                                            message.role === 'user'
                                                ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white'
                                                : 'bg-white dark:bg-neutral-700 border border-purple-100 dark:border-neutral-600 text-neutral-800 dark:text-neutral-100'
                                        }`}>
                                            <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                                {message.content}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Route Description */}
                                    {message.isRoute && message.routeDescription && (
                                        <div className="mt-3 ml-2">
                                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-700">
                                                <div className="flex items-start gap-3">
                                                    <Route className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                                                    <div>
                                                        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1 text-sm">📍 Planned Route</h4>
                                                        <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">{message.routeDescription}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Interactive Map */}
                                    {message.recommendations && message.recommendations.length > 0 && (
                                       <div className="mt-3 ml-2 space-y-2">
                                           <div className="bg-white dark:bg-neutral-700 rounded-xl border border-purple-200 dark:border-neutral-600 overflow-hidden">
                                                <div className="h-48 relative">
                                                    <MapContainer 
                                                        center={(() => {
                                                            const locs = message.recommendations
                                                                .map(r => allLocations.find(l => l.id === r.location_id))
                                                                .filter(l => l && l.latitude && l.longitude);
                                                            if (locs.length === 0) return [48.8566, 2.3522];
                                                            return [
                                                                locs.reduce((sum, l) => sum + l.latitude, 0) / locs.length,
                                                                locs.reduce((sum, l) => sum + l.longitude, 0) / locs.length
                                                            ];
                                                        })()}
                                                        zoom={12}
                                                        className="w-full h-full"
                                                        zoomControl={false}
                                                        scrollWheelZoom={false}
                                                        dragging={true}
                                                    >
                                                        <TileLayer
                                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                        />
                                                        <MarkerClusterGroup
                                                            chunkedLoading
                                                            spiderfyOnMaxZoom={true}
                                                            showCoverageOnHover={false}
                                                            maxClusterRadius={40}
                                                            iconCreateFunction={(cluster) => {
                                                                const count = cluster.getChildCount();
                                                                return L.divIcon({
                                                                    html: `<div style="width: 32px; height: 32px; background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3); border: 3px solid white;"><span style="color: white; font-size: 12px; font-weight: bold;">${count}</span></div>`,
                                                                    className: 'custom-cluster-icon',
                                                                    iconSize: L.point(32, 32)
                                                                });
                                                            }}
                                                        >
                                                            {message.recommendations.map((rec, idx) => {
                                                                const location = allLocations.find(l => l.id === rec.location_id);
                                                                if (!location || !location.latitude || !location.longitude) return null;
                                                                
                                                                return (
                                                                    <Marker
                                                                        key={idx}
                                                                        position={[location.latitude, location.longitude]}
                                                                        icon={L.divIcon({
                                                                            className: 'custom-marker',
                                                                            html: `<div style="width: 28px; height: 28px; background: #9333ea; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3); border: 3px solid white;"><span style="color: white; font-size: 14px; font-weight: bold;">${idx + 1}</span></div>`,
                                                                            iconSize: [28, 28],
                                                                            iconAnchor: [14, 14]
                                                                        })}
                                                                        eventHandlers={{
                                                                            click: () => {
                                                                                setSelectedLocation(location);
                                                                                setIsLocationCardOpen(true);
                                                                            }
                                                                        }}
                                                                    >
                                                                        <Popup closeButton={false}>
                                                                            <div 
                                                                                className="cursor-pointer p-2"
                                                                                onClick={() => {
                                                                                    setSelectedLocation(location);
                                                                                    setIsLocationCardOpen(true);
                                                                                }}
                                                                            >
                                                                                <div className="font-semibold text-sm text-neutral-900">{location.name}</div>
                                                                                <div className="text-xs text-neutral-600 mt-1">{location.city}</div>
                                                                                <div className="text-xs text-purple-600 mt-2 font-medium">Нажмите для деталей →</div>
                                                                            </div>
                                                                        </Popup>
                                                                    </Marker>
                                                                );
                                                            })}
                                                        </MarkerClusterGroup>
                                                    </MapContainer>
                                                    <div className="absolute top-2 left-2 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-medium text-neutral-700 shadow-sm flex items-center gap-1">
                                                        <MapIcon className="w-3 h-3" />
                                                        {message.recommendations.length} мест
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Recommendation Cards */}
                                    {message.recommendations && message.recommendations.length > 0 && (
                                        <div className="mt-3 space-y-2 ml-2">
                                            {message.recommendations.map((rec, idx) => {
                                                const location = allLocations.find(l => l.id === rec.location_id);
                                                if (!location) return null;

                                                const info = message.verifiedInfo?.[location.id];

                                                return (
                                                    <motion.div
                                                        key={idx}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: idx * 0.1 }}
                                                        className="bg-white dark:bg-neutral-700 rounded-xl border border-purple-200 dark:border-neutral-600 overflow-hidden hover:shadow-lg transition-all"
                                                    >
                                                        {/* Image Header */}
                                                        <div 
                                                            className="relative h-32 cursor-pointer"
                                                            onClick={() => {
                                                                setSelectedLocation(location);
                                                                setIsLocationCardOpen(true);
                                                            }}
                                                        >
                                                            <img 
                                                                src={location.image_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80"}
                                                                alt={location.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                                            <h4 className="absolute bottom-3 left-3 right-3 font-semibold text-white text-base">
                                                                {location.name}
                                                            </h4>
                                                        </div>

                                                        {/* Info Content */}
                                                        <div className="p-4 space-y-3">
                                                            {/* Location & Type */}
                                                            <div className="flex items-center justify-between text-xs">
                                                                <div className="flex items-center gap-1 text-neutral-600 dark:text-neutral-300">
                                                                    <MapPin className="w-3 h-3" />
                                                                    <span>{location.city}, {location.country}</span>
                                                                    {getDistanceText(location) && (
                                                                        <>
                                                                            <span className="text-neutral-400">•</span>
                                                                            <span className="font-medium text-purple-600">{getDistanceText(location)}</span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                                <Badge className="bg-purple-100 text-purple-700 text-xs">
                                                                    {typeLabels[location.type]}
                                                                </Badge>
                                                            </div>

                                                            {/* Verified Info */}
                                                            {info && (
                                                                <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-600">
                                                                    <div className="flex items-start gap-2">
                                                                        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 w-20 flex-shrink-0">Средний чек:</span>
                                                                        <span className="text-xs text-neutral-900 dark:text-neutral-100">{info.average_bill}</span>
                                                                    </div>
                                                                    <div className="flex items-start gap-2">
                                                                        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 w-20 flex-shrink-0">Часы работы:</span>
                                                                        <span className="text-xs text-neutral-900 dark:text-neutral-100">{info.opening_hours}</span>
                                                                    </div>
                                                                    <div className="flex items-start gap-2">
                                                                        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 w-20 flex-shrink-0">Популярное:</span>
                                                                        <span className="text-xs text-neutral-900 dark:text-neutral-100">{info.popular_dishes}</span>
                                                                        </div>
                                                                        {info.website && info.website !== "Информация не найдена" && info.website !== "Not found" && (
                                                                        <a 
                                                                            href={info.website}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        >
                                                                            🌐 Website →
                                                                        </a>
                                                                        )}
                                                                </div>
                                                            )}

                                                            {/* Action Buttons */}
                                                            <div className="flex gap-2 mt-2">
                                                                <Button
                                                                   onClick={() => {
                                                                       setSelectedLocation(location);
                                                                       setIsLocationCardOpen(true);
                                                                   }}
                                                                   variant="outline"
                                                                   className="flex-1 rounded-full h-9 text-xs"
                                                                >
                                                                   Подробнее
                                                                </Button>
                                                                <Button
                                                                   onClick={(e) => {
                                                                       e.stopPropagation();
                                                                       generateICS(location);
                                                                   }}
                                                                   variant="ghost"
                                                                   size="icon"
                                                                   className="rounded-full h-9 w-9 shrink-0"
                                                                   title="Добавить в календарь"
                                                                >
                                                                   <Calendar className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            ))}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-white dark:bg-neutral-700 border border-purple-100 dark:border-neutral-600 rounded-2xl px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin text-purple-600 dark:text-purple-400" />
                                            <span className="text-sm text-neutral-900 dark:text-neutral-100">{t('analyzing') || 'Анализирую...'}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-purple-100 dark:border-neutral-700 bg-white dark:bg-neutral-800">
                            <div className="flex gap-2">
                                <Input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="What are you looking for?"
                                    disabled={loading}
                                    className="flex-1 rounded-full border-purple-200 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500 focus:border-purple-400"
                                />
                                <Button
                                    onClick={handleSendMessage}
                                    disabled={loading || !input.trim()}
                                    className="rounded-full w-11 h-11 p-0 bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                >
                                    {loading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Send className="w-5 h-5" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Collapsed AI Button - Shows when location card is open */}
            <AnimatePresence>
                {isLocationCardOpen && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        onClick={() => {
                            setIsLocationCardOpen(false);
                            setSelectedLocation(null);
                            setIsOpen(true);
                        }}
                        className="fixed bottom-20 right-6 md:bottom-24 md:right-8 w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-50"
                        aria-label="Open AI Assistant"
                    >
                        <Sparkles className="w-6 h-6 text-white" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Location Detail Modal */}
            {selectedLocation && (
                <LocationCard
                    location={selectedLocation}
                    savedLocation={savedLocations.find(s => s.location_id === selectedLocation.id)}
                    onSave={onSave}
                    onUpdate={onUpdate}
                    user={user}
                    isOpen={isLocationCardOpen}
                    onOpenChange={(open) => {
                        setIsLocationCardOpen(open);
                        if (!open) {
                            setSelectedLocation(null);
                            setIsOpen(true);
                        }
                    }}
                />
            )}
        </>
    );
}