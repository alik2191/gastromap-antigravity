import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, MapPin, TrendingUp, Loader2, RefreshCw, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AIRecommendations({ user, savedLocations, allLocations }) {
    const [recommendations, setRecommendations] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (user && savedLocations && allLocations) {
            generateRecommendations();
        }
    }, [user, savedLocations?.length, allLocations?.length]);

    const generateRecommendations = async () => {
        setLoading(true);
        setError(null);

        try {
            const visitedLocations = savedLocations
                .filter(s => s.list_type === 'visited')
                .map(s => {
                    const loc = allLocations.find(l => l.id === s.location_id);
                    return loc ? `${loc.name} (${loc.type}, ${loc.city}, ${loc.country})` : null;
                })
                .filter(Boolean);

            const wishlistLocations = savedLocations
                .filter(s => s.list_type === 'wishlist')
                .map(s => {
                    const loc = allLocations.find(l => l.id === s.location_id);
                    return loc ? `${loc.name} (${loc.type}, ${loc.city}, ${loc.country})` : null;
                })
                .filter(Boolean);

            const availableLocations = allLocations.slice(0, 50).map(l => 
                `${l.name} (${l.type}, ${l.city}, ${l.country})`
            );

            const prompt = `You are a gastronomy expert providing personalized recommendations.

User's Profile:
- Visited locations: ${visitedLocations.length > 0 ? visitedLocations.join(', ') : 'None yet'}
- Wishlist: ${wishlistLocations.length > 0 ? wishlistLocations.join(', ') : 'None yet'}

Available locations to recommend from: ${availableLocations.join(', ')}

Based on the user's preferences and visited places, provide 3-4 personalized recommendations. For each recommendation:
1. Choose a location name from the available locations list
2. Explain why it matches their taste (based on their history)
3. Keep it concise and exciting

Format your response as a JSON array with this structure:
[
  {
    "locationName": "exact name from available locations",
    "reason": "short compelling reason (max 100 chars)",
    "category": "similar_taste" or "new_experience" or "trending"
  }
]`;

            const result = await base44.integrations.Core.InvokeLLM({
                prompt,
                response_json_schema: {
                    type: "object",
                    properties: {
                        recommendations: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    locationName: { type: "string" },
                                    reason: { type: "string" },
                                    category: { type: "string" }
                                }
                            }
                        }
                    }
                }
            });

            setRecommendations(result.recommendations || []);
        } catch (err) {
            console.error('Error generating recommendations:', err);
            setError('Unable to generate recommendations');
        } finally {
            setLoading(false);
        }
    };

    const getCategoryIcon = (category) => {
        switch (category) {
            case 'similar_taste': return '🎯';
            case 'new_experience': return '✨';
            case 'trending': return '🔥';
            default: return '⭐';
        }
    };

    const getCategoryLabel = (category) => {
        switch (category) {
            case 'similar_taste': return 'Based on your taste';
            case 'new_experience': return 'New experience';
            case 'trending': return 'Trending';
            default: return 'Recommended';
        }
    };

    const handleLocationClick = (locationName) => {
        const location = allLocations.find(l => l.name === locationName);
        if (location) {
            // Scroll to location card
            const element = document.querySelector(`[data-location-id="${location.id}"]`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.classList.add('ring-2', 'ring-amber-400', 'ring-offset-2');
                setTimeout(() => {
                    element.classList.remove('ring-2', 'ring-amber-400', 'ring-offset-2');
                }, 2000);
            }
        }
    };

    if (loading && !recommendations) {
        return (
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                <div className="flex items-center justify-center gap-3 text-purple-600">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm font-medium">AI is analyzing your preferences...</span>
                </div>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="p-6 bg-red-50 border-red-200">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-red-600">{error}</span>
                    <Button 
                        variant="outline" 
                        size="sm"
                        onClick={generateRecommendations}
                        className="border-red-300 text-red-600 hover:bg-red-100"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Retry
                    </Button>
                </div>
            </Card>
        );
    }

    if (!recommendations || recommendations.length === 0) {
        return null;
    }

    return (
        <Card className="overflow-hidden bg-gradient-to-br from-purple-50 via-pink-50 to-amber-50 border-purple-200/50">
            <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-neutral-900">AI Recommendations</h3>
                            <p className="text-xs text-neutral-600">Personalized for you</p>
                        </div>
                    </div>
                    <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={generateRecommendations}
                        disabled={loading}
                        className="text-purple-600 hover:text-purple-700 hover:bg-purple-100"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>

                <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                        {recommendations.map((rec, index) => {
                            const location = allLocations.find(l => l.name === rec.locationName);
                            
                            return (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3, delay: index * 0.1 }}
                                >
                                    <button
                                        onClick={() => handleLocationClick(rec.locationName)}
                                        className="w-full bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-purple-100 hover:border-purple-300 hover:shadow-md transition-all duration-200 text-left group"
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className="text-2xl mt-0.5">{getCategoryIcon(rec.category)}</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2 mb-1">
                                                    <h4 className="font-medium text-neutral-900 group-hover:text-purple-600 transition-colors">
                                                        {rec.locationName}
                                                    </h4>
                                                    <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all flex-shrink-0 mt-0.5" />
                                                </div>
                                                {location && (
                                                    <div className="flex items-center gap-2 text-xs text-neutral-500 mb-2">
                                                        <MapPin className="w-3 h-3" />
                                                        <span>{location.city}, {location.country}</span>
                                                    </div>
                                                )}
                                                <p className="text-sm text-neutral-600 line-clamp-2 mb-2">
                                                    {rec.reason}
                                                </p>
                                                <Badge 
                                                    variant="secondary"
                                                    className="bg-purple-100 text-purple-700 text-xs"
                                                >
                                                    {getCategoryLabel(rec.category)}
                                                </Badge>
                                            </div>
                                        </div>
                                    </button>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>
        </Card>
    );
}