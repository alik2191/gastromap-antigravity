import React, { useState, useRef, useEffect } from 'react';
import { api } from '@/api/client';
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
                // Fetch latest session for user
                const { data: sessions, error: sessionError } = await api.client
                    .from('chat_sessions')
                    .select('id')
                    .eq('user_id', user.id)
                    .order('updated_at', { ascending: false })
                    .limit(1);

                if (sessionError) throw sessionError;

                if (sessions && sessions.length > 0) {
                    const convId = sessions[0].id;
                    setConversationId(convId);

                    // Fetch messages
                    const { data: messagesData, error: msgError } = await api.client
                        .from('chat_messages')
                        .select('*')
                        .eq('session_id', convId)
                        .order('created_at', { ascending: true });

                    if (msgError) throw msgError;

                    if (messagesData && messagesData.length > 0) {
                        const loadedMessages = messagesData.map(msg => ({
                            role: msg.role,
                            content: msg.content,
                            timestamp: new Date(msg.created_at),
                            // Recommendations parsing can be added if we structure the JSON response in future
                        }));
                        setMessages(loadedMessages);
                    }
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
        setInput('');
        setLoading(true);

        // Check if this is a route planning request for UI indication
        const isRouteRequest = /route|маршрут|plan|путь|itinerary/i.test(userMessage.content);
        if (isRouteRequest) {
            setRouteMode(true);
        }

        try {
            // Call the AI Guide Edge Function
            // This function handles:
            // 1. Fetching user context (wishlist, visited)
            // 2. Maintaining chat history in DB (chat_sessions/chat_messages)
            // 3. Calling Gemini with the system prompt
            // 4. Returning the response
            const response = await api.functions.invoke('ai-guide-chat', {
                message: userMessage.content,
                sessionId: conversationId,
                userId: user?.id,
                userLocation: userLocation
            });

            if (response.data && response.data.reply) {
                const aiReply = response.data.reply;
                const newSessionId = response.data.sessionId;

                if (newSessionId && newSessionId !== conversationId) {
                    setConversationId(newSessionId);
                }

                // Parse structured parts if any (the edge function currently returns text, 
                // but we can enhance it to return JSON for recommendations later. 
                // For now, assume text reply, but we can parse simple recommendations if we structure the prompt output in the edge function later)

                // Note: The current edge function implementation returns text. 
                // If we want recommendations to be parsed, we need to ask the edge function to output JSON or parse the text.
                // For this iteration, we display the text.

                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: aiReply,
                    timestamp: new Date()
                }]);

            } else {
                throw new Error('No reply from AI Guide');
            }


        } catch (error) {
            console.error('AI Guide error:', error);

            // Parse error response if available
            let errorMessage = t('errorProcessingRequest') || 'Sorry, I encountered an error. Please try again.';
            let errorType = 'unknown';

            if (error.response?.data) {
                const errorData = error.response.data;
                errorType = errorData.type || 'unknown';

                // Provide specific error messages based on type
                if (errorType === 'ai_guide_error' || errorType === 'llm_error') {
                    if (errorData.error?.includes('API Key')) {
                        errorMessage = '🔑 AI service is not configured. Please contact support.';
                    } else if (errorData.error?.includes('quota')) {
                        errorMessage = '⚠️ AI service quota exceeded. Please try again later.';
                    } else {
                        errorMessage = `❌ ${errorData.error || errorMessage}`;
                    }
                }
            } else if (error.message) {
                errorMessage = `❌ ${error.message}`;
            }

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: errorMessage,
                timestamp: new Date(),
                isError: true
            }]);

            toast.error(errorMessage);
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
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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
                        className="fixed bottom-6 right-6 md:bottom-8 md:right-8 w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-[9999]"
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
                        className="fixed top-[68px] left-0 right-0 bottom-16 md:bottom-8 md:right-8 md:top-auto md:left-auto md:w-[450px] md:h-[600px] bg-white dark:bg-neutral-800 md:rounded-3xl shadow-2xl flex flex-col z-[9999] overflow-hidden border-0 md:border md:border-purple-100 dark:md:border-neutral-700"
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
                                        <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${message.role === 'user'
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
                                                            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
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