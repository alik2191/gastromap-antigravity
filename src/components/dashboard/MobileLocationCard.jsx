import React, { useState, memo } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Star, Heart, Check, AlertCircle, Instagram, Facebook, Youtube, Linkedin, Twitter, Globe } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { useLanguage } from '../LanguageContext';
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { typeLabels } from '../constants';

const MobileLocationCard = memo(function MobileLocationCard({ location, savedLocation, onSave, onOpenDetail }) {
    const { language, t } = useLanguage();
    const [saving, setSaving] = useState(false);

    // Get localized city and country for URL params
    const getLocalizedField = (field) => {
        if (language === 'ru') return location[field];
        const localizedField = `${field}_${language}`;
        return location[localizedField] || location[field];
    };

    const localizedCountry = getLocalizedField('country');
    const localizedCity = getLocalizedField('city');

    const { data: reviews = [] } = useQuery({
        queryKey: ['reviews', location.id],
        queryFn: () => api.entities.Review.filter({ location_id: location.id })
    });

    const averageRating = reviews.length > 0
        ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
        : 0;

    // Check if location was updated after user saved it
    const hasUpdates = savedLocation && location.updated_date &&
        new Date(location.updated_date) > new Date(savedLocation.created_date);

    // Check if location is pending moderation
    const isPending = location.status === 'pending';

    // Check if location is new (created within last 14 days)
    const isNew = location.created_date &&
        new Date(location.created_date) > new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    const localizedDescription = getLocalizedField('description');

    // Function to detect social media type from URL
    const getSocialIcon = (url) => {
        const lowerUrl = url.toLowerCase();
        if (lowerUrl.includes('instagram.com')) return { icon: Instagram, color: 'text-pink-600' };
        if (lowerUrl.includes('facebook.com') || lowerUrl.includes('fb.com')) return { icon: Facebook, color: 'text-blue-600' };
        if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return { icon: Youtube, color: 'text-red-600' };
        if (lowerUrl.includes('linkedin.com')) return { icon: Linkedin, color: 'text-blue-700' };
        if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) return { icon: Twitter, color: 'text-sky-600' };
        return { icon: Globe, color: 'text-neutral-600' };
    };

    const handleSave = async (listType, e) => {
        e.stopPropagation();
        e.preventDefault();
        setSaving(true);
        try {
            await onSave(location.id, listType, '');
        } catch (error) {
            console.error('Error in handleSave:', error);
        } finally {
            setSaving(false);
        }
    };

    // Build URL with navigation state
    const buildLocationUrl = () => {
        const params = new URLSearchParams();
        params.set('id', location.id);

        // Preserve navigation state
        const currentParams = new URLSearchParams(window.location.search);
        const country = currentParams.get('country');
        const city = currentParams.get('city');

        if (country) params.set('country', country);
        if (city) params.set('city', city);

        return `${createPageUrl('LocationDetail')}?${params.toString()}`;
    };

    return (
        <Link
            to={buildLocationUrl()}
            className={`bg-white dark:bg-neutral-800 rounded-3xl overflow-hidden shadow-sm cursor-pointer block relative ${isNew
                    ? 'border-2 border-blue-400 dark:border-blue-500 animate-pulse-slow ring-2 ring-blue-400/20'
                    : hasUpdates
                        ? 'border-2 border-purple-400 dark:border-purple-500 ring-2 ring-purple-400/20'
                        : 'border border-stone-100 dark:border-neutral-700'
                }`}
        >
            {/* Image */}
            <div className="relative aspect-[4/3] overflow-hidden">
                <img
                    src={location.image_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80"}
                    alt={`Photo of ${location.name}`}
                    loading="lazy"
                    className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 flex flex-col gap-1.5 items-end">
                    {isPending && (
                        <Badge className="bg-orange-500 text-white border-0 rounded-full px-2 py-0.5 shadow-lg text-[10px]">
                            <AlertCircle className="w-2.5 h-2.5 mr-0.5" />
                            Pending
                        </Badge>
                    )}
                    {!isPending && isNew && (
                        <Badge className="bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 text-white border-0 rounded-full px-2 py-0.5 shadow-lg animate-pulse font-bold text-[10px]">
                            ✨ NEW
                        </Badge>
                    )}
                    {!isPending && !isNew && location.is_hidden_gem && (
                        <Badge className="bg-blue-500 text-white border-0 rounded-full px-2 py-0.5 shadow-lg text-[10px]">
                            <MapPin className="w-2.5 h-2.5 mr-0.5" />
                            SECRET
                        </Badge>
                    )}
                    {!isPending && !isNew && hasUpdates && (
                        <Badge className="bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 text-white border-0 rounded-full px-2 py-0.5 shadow-lg animate-bounce-slow font-bold text-[10px]">
                            🔥 Updated
                        </Badge>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="p-3">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-1 leading-tight line-clamp-1">
                    {location.name}
                </h3>

                <div className="flex items-center text-neutral-500 dark:text-neutral-400 text-[10px] mb-2 line-clamp-1">
                    <MapPin className="w-2.5 h-2.5 mr-0.5 shrink-0" />
                    <span className="truncate">{localizedCity}</span>
                </div>

                {/* Type */}
                <div className="mb-2.5">
                    <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-0 text-[9px] px-1.5 py-0.5">
                        {typeLabels[location.type] || location.type}
                    </Badge>
                </div>

                {/* Rating & Price */}
                <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-1">
                        <Star className={`w-3 h-3 shrink-0 ${averageRating > 0 ? 'fill-amber-400 text-amber-400' : 'text-neutral-300 dark:text-neutral-600'}`} />
                        <span className="text-[10px] font-medium text-neutral-900 dark:text-neutral-300">
                            {reviews.length > 0 ? `${averageRating} (${reviews.length})` : '—'}
                        </span>
                    </div>
                    {location.price_range && (
                        <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                            {location.price_range}
                        </span>
                    )}
                </div>

                {/* Action Button */}
                <Button
                    onClick={(e) => handleSave('wishlist', e)}
                    disabled={saving}
                    className={`w-full rounded-full h-8 font-medium transition-all text-[10px] px-2 active:scale-95 ${savedLocation?.list_type === 'wishlist'
                            ? 'bg-rose-100 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-900/30 border-rose-300 dark:border-rose-800'
                            : 'bg-rose-50 dark:bg-neutral-700 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-neutral-600 border-rose-200 dark:border-neutral-600'
                        }`}
                    variant="outline"
                    aria-label={savedLocation?.list_type === 'wishlist' ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                    <Heart className={`w-3 h-3 mr-1 ${savedLocation?.list_type === 'wishlist' ? 'fill-current' : ''}`} />
                    {savedLocation?.list_type === 'wishlist' ? t('saved') : 'Save'}
                </Button>
            </div>
        </Link>
    );
});

export default MobileLocationCard;