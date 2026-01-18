import React, { useState, useEffect, memo } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    MapPin, Star, Heart, Check, X, Sparkles, AlertCircle, Clock, Phone, Calendar,
    Instagram, Facebook, Youtube, Linkedin, Twitter, Globe
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useQuery } from '@tanstack/react-query';
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ReviewSection from './ReviewSection';
import AdminNotesList from './AdminNotesList';
import { useLanguage } from '../LanguageContext';
import { api } from '@/api/client';
import { typeLabels, typeColors } from '../constants';

const LocationCard = memo(function LocationCard({
    location, savedLocation, onSave, onUpdate, user,
    isOpen, onOpenChange
}) {
    const { language, t } = useLanguage();
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = typeof isOpen !== 'undefined';
    const showDetail = isControlled ? isOpen : internalOpen;

    const handleOpenChange = (open) => {
        if (isControlled) {
            onOpenChange?.(open);
        } else {
            setInternalOpen(open);
        }
    };

    const [note, setNote] = useState(savedLocation?.personal_note || '');
    const [saving, setSaving] = useState(false);
    const [viewTracked, setViewTracked] = useState(false);

    // Sync note when savedLocation changes
    useEffect(() => {
        setNote(savedLocation?.personal_note || '');
    }, [savedLocation]);

    // Track view when dialog opens
    useEffect(() => {
        const trackView = async () => {
            if (showDetail && !viewTracked && location?.id) {
                try {
                    const currentUser = await api.auth.me().catch(() => null);
                    await api.entities.LocationView.create({
                        location_id: location.id,
                        user_email: currentUser?.email || 'anonymous',
                        viewed_at: new Date().toISOString()
                    });
                    setViewTracked(true);
                } catch (error) {
                    console.error('LocationView tracking error:', error);
                }
            }
        };
        trackView();
    }, [showDetail, location?.id, viewTracked]);

    const { data: reviews = [] } = useQuery({
        queryKey: ['reviews', location.id],
        queryFn: async () => {
            const allReviews = await api.entities.Review.filter({ location_id: location.id });
            return allReviews.filter(r => !r.is_hidden);
        },
        enabled: showDetail
    });

    const averageRating = reviews.length > 0
        ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
        : 0;

    // Check if location was updated after user saved it
    const hasUpdates = savedLocation && location.updated_date &&
        new Date(location.updated_date) > new Date(savedLocation.created_date);

    const wasRecentlyUpdated = location.updated_date &&
        (Date.now() - new Date(location.updated_date).getTime()) < 7 * 24 * 60 * 60 * 1000; // 7 days

    // Check if location is new (created within last 14 days)
    const isNew = location.created_date &&
        new Date(location.created_date) > new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    // Get localized content (NOT name or address - those are unique/proper nouns)
    const getLocalizedField = (field) => {
        if (language === 'ru') return location[field];
        const localizedField = `${field}_${language}`;
        return location[localizedField] || location[field];
    };

    const localizedDescription = getLocalizedField('description');
    const localizedInsiderTip = getLocalizedField('insider_tip');
    const localizedMustTry = getLocalizedField('must_try');
    const localizedCountry = getLocalizedField('country');
    const localizedCity = getLocalizedField('city');

    // Function to detect social media type from URL
    const getSocialIcon = (url) => {
        const lowerUrl = url.toLowerCase();
        if (lowerUrl.includes('instagram.com')) return { icon: Instagram, color: 'text-pink-600 hover:text-pink-700' };
        if (lowerUrl.includes('facebook.com') || lowerUrl.includes('fb.com')) return { icon: Facebook, color: 'text-blue-600 hover:text-blue-700' };
        if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return { icon: Youtube, color: 'text-red-600 hover:text-red-700' };
        if (lowerUrl.includes('linkedin.com')) return { icon: Linkedin, color: 'text-blue-700 hover:text-blue-800' };
        if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) return { icon: Twitter, color: 'text-sky-600 hover:text-sky-700' };
        return { icon: Globe, color: 'text-neutral-600 hover:text-neutral-700' };
    };

    const handleSave = async (listType) => {
        setSaving(true);
        try {
            await onSave(location.id, listType, note);
        } catch (error) {
            console.error('Error in handleSave:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateNote = async () => {
        if (!note.trim()) {
            toast.error(t('noteCannotBeEmpty'));
            return;
        }

        try {
            if (savedLocation) {
                await onUpdate(savedLocation.id, { personal_note: note });
            } else {
                // Если локация еще не сохранена, сохраним ее в wishlist с заметкой
                await handleSave('wishlist');
            }
        } catch (error) {
            console.error('Error saving note:', error);
            toast.error(t('errorSavingNote') || 'Не удалось сохранить заметку. Попробуйте еще раз.');
        }
    };

    return (
        <>
            <div
                onClick={() => handleOpenChange(true)}
                data-location-id={location.id}
                className={`group bg-white dark:bg-neutral-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-blue-900/5 dark:hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full flex flex-col relative ${isNew
                        ? 'border-2 border-blue-400 dark:border-blue-500 animate-pulse-slow ring-2 ring-blue-400/20'
                        : hasUpdates && wasRecentlyUpdated
                            ? 'border-2 border-purple-400 dark:border-purple-500 ring-2 ring-purple-400/20'
                            : 'border border-neutral-100 dark:border-neutral-700'
                    }`}
            >
                <div className="aspect-[16/10] overflow-hidden relative">
                    <img
                        src={location.image_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80"}
                        alt={`Photo of ${location.name} in ${localizedCity}`}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                        {isNew && (
                            <Badge className="bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 text-white border-none shadow-lg px-3 py-1.5 animate-pulse font-bold">
                                ✨ NEW
                            </Badge>
                        )}
                        {!isNew && location.is_hidden_gem && (
                            <Badge className="bg-white/95 backdrop-blur text-amber-900 border-none shadow-sm px-3 py-1 hover:bg-amber-500 hover:text-white hover:shadow-lg hover:scale-105 transition-all duration-300">
                                <Star className="w-3 h-3 mr-1 text-amber-500 fill-amber-500 group-hover:text-white group-hover:fill-white" />
                                Hidden Gem
                            </Badge>
                        )}
                        {!isNew && hasUpdates && wasRecentlyUpdated && (
                            <Badge className="bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 text-white border-none shadow-lg px-3 py-1.5 animate-bounce-slow font-bold">
                                🔥 Updated
                            </Badge>
                        )}
                        {location.special_labels && location.special_labels.slice(0, 2).map(label => (
                            <Badge key={label} className="bg-white/90 backdrop-blur text-neutral-900 border-none shadow-sm px-3 py-1 text-xs font-medium hover:bg-white hover:text-neutral-900 transition-colors">
                                {t(label)}
                            </Badge>
                        ))}
                    </div>

                    {savedLocation && (
                        <div className="absolute top-3 right-3">
                            {savedLocation.list_type === 'visited' ? (
                                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                    <Check className="w-4 h-4 text-white" />
                                </div>
                            ) : (
                                <div className="w-8 h-8 bg-rose-500 rounded-full flex items-center justify-center">
                                    <Heart className="w-4 h-4 text-white" />
                                </div>
                            )}
                        </div>
                    )}

                    <div className="absolute bottom-3 left-3 right-3">
                        <Badge variant="secondary" className={typeColors[location.type]}>
                            {typeLabels[location.type] || location.type}
                        </Badge>
                    </div>
                </div>

                <div className="p-5">
                    <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {location.name}
                    </h3>

                    <div className="flex items-center text-neutral-700 dark:text-neutral-400 text-sm mb-3">
                        <MapPin className="w-4 h-4 mr-1" />
                        {localizedCity}, {localizedCountry}
                        {location.price_range && (
                            <>
                                <span className="mx-2">•</span>
                                <span className="text-amber-600 dark:text-amber-400">{location.price_range}</span>
                            </>
                        )}
                    </div>

                    <p className="text-neutral-700 dark:text-neutral-400 text-sm line-clamp-2 mb-3">
                        {localizedDescription}
                    </p>

                    {/* Rating Display */}
                    {reviews.length > 0 && (
                        <div className="flex items-center gap-2">
                            <div className="flex gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        className={`w-3.5 h-3.5 ${i < Math.round(averageRating) ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}`}
                                    />
                                ))}
                            </div>
                            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-300">{averageRating}</span>
                            <span className="text-xs text-neutral-700 dark:text-neutral-500">({reviews.length})</span>
                        </div>
                    )}
                </div>
            </div>

            <Dialog open={showDetail} onOpenChange={handleOpenChange}>
                <DialogContent className="p-0 max-w-2xl max-h-[95vh] overflow-hidden flex flex-col gap-0 sm:rounded-3xl [&>button]:hidden bg-white dark:bg-neutral-800 dark:border-neutral-700 z-[9999]">
                    {/* Hero Image Section */}
                    <div className="relative h-[200px] sm:h-[350px] shrink-0">
                        <img
                            src={location.image_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80"}
                            alt={location.name}
                            loading="lazy"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                        {/* Close Button */}
                        <button
                            onClick={() => handleOpenChange(false)}
                            className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg z-50"
                            aria-label="Close location details"
                        >
                            <X className="w-5 h-5 text-neutral-700" />
                        </button>

                        {/* Title & Location */}
                        <div className="absolute bottom-0 left-0 right-0 p-6">
                            <h2 className="text-3xl font-bold mb-2 text-white drop-shadow-lg">{location.name}</h2>
                            <div className="flex items-center text-white/95">
                                <MapPin className="w-4 h-4 mr-1" />
                                <span className="text-sm drop-shadow">{localizedCity}, {localizedCountry}</span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons - Outside of image */}
                    <div className="px-6 py-4 border-b dark:border-neutral-700 flex gap-3">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSave('wishlist');
                                        }}
                                        disabled={saving}
                                        className={`flex-1 rounded-full h-12 font-medium ${savedLocation?.list_type === 'wishlist'
                                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                                            }`}
                                        aria-label="Save to wishlist"
                                    >
                                        <Heart className={`w-4 h-4 mr-2 ${savedLocation?.list_type === 'wishlist' ? 'fill-current' : ''}`} />
                                        {t('saved')}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{savedLocation?.list_type === 'wishlist' ? t('saved') : t('saveToWishlist')}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSave('visited');
                                        }}
                                        disabled={saving}
                                        variant="outline"
                                        className={`flex-1 rounded-full h-12 font-medium ${savedLocation?.list_type === 'visited' ? 'bg-green-50 text-green-700 border-green-200' : ''
                                            }`}
                                        aria-label="Mark as visited"
                                    >
                                        <Check className="w-4 h-4 mr-2" />
                                        {t('visited')}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{savedLocation?.list_type === 'visited' ? t('visited') : t('markAsVisited')}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>

                    {/* Content Section - Scrollable */}
                    <div className="overflow-y-auto flex-1">
                        <Tabs defaultValue="overview" className="w-full">
                            <TabsList className="w-full justify-start rounded-none border-b dark:border-neutral-700 bg-transparent h-auto p-0">
                                <TabsTrigger
                                    value="overview"
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-neutral-900 dark:data-[state=active]:border-neutral-100 data-[state=active]:bg-transparent px-6 py-3 text-neutral-700 dark:text-neutral-300 data-[state=active]:text-neutral-900 dark:data-[state=active]:text-neutral-100"
                                >
                                    {t('overview')}
                                </TabsTrigger>
                                <TabsTrigger
                                    value="reviews"
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-neutral-900 dark:data-[state=active]:border-neutral-100 data-[state=active]:bg-transparent px-6 py-3 text-neutral-700 dark:text-neutral-300 data-[state=active]:text-neutral-900 dark:data-[state=active]:text-neutral-100"
                                >
                                    {t('reviews')}
                                </TabsTrigger>
                                <TabsTrigger
                                    value="notes"
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-neutral-900 dark:data-[state=active]:border-neutral-100 data-[state=active]:bg-transparent px-6 py-3 text-neutral-700 dark:text-neutral-300 data-[state=active]:text-neutral-900 dark:data-[state=active]:text-neutral-100"
                                >
                                    {t('myNotes')}
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="overview" className="p-6">
                                {/* Single unified content container */}
                                <div className="bg-white dark:bg-neutral-800 space-y-4">
                                    {/* Badges & Rating */}
                                    <div className="flex flex-wrap items-center gap-2 pb-4 border-b dark:border-neutral-700">
                                        {location.is_hidden_gem && (
                                            <Badge className="bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-300 text-xs font-semibold uppercase tracking-wide px-2.5 py-1">
                                                {t('hiddenGem')}
                                            </Badge>
                                        )}
                                        {location.price_range && (
                                            <Badge className="bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-300 text-sm font-semibold px-2.5 py-1">
                                                {location.price_range}
                                            </Badge>
                                        )}
                                        {location.special_labels && location.special_labels.map(label => (
                                            <Badge key={label} className="bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-300 text-xs font-semibold uppercase tracking-wide px-2.5 py-1 hover:bg-neutral-200 dark:hover:bg-neutral-600 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
                                                {t(label)}
                                            </Badge>
                                        ))}
                                        <div className="flex gap-0.5 ml-auto">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={`w-4 h-4 ${i < 4 ? 'fill-amber-400 text-amber-400' : 'text-neutral-300 dark:text-neutral-600'}`}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Description */}
                                    {localizedDescription && (
                                        <div className="pb-4 border-b dark:border-neutral-700">
                                            <p className="text-neutral-900 dark:text-neutral-300 leading-relaxed text-sm">
                                                {localizedDescription}
                                            </p>
                                        </div>
                                    )}

                                    {/* Curator's Tip */}
                                    {localizedInsiderTip && (
                                        <div className={`pb-4 border-b dark:border-neutral-700 ${hasUpdates && wasRecentlyUpdated ? 'border-l-4 border-l-blue-500 pl-3' : ''}`}>
                                            <div className="flex items-center gap-2 mb-2">
                                                <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                                <h4 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">{t('curatorsTip')}</h4>
                                                {hasUpdates && wasRecentlyUpdated && (
                                                    <Badge className="bg-blue-500 text-white text-xs ml-auto">
                                                        {t('updated')}
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-neutral-900 dark:text-neutral-300 italic leading-relaxed text-sm">
                                                "{localizedInsiderTip}"
                                            </p>
                                            {location.updated_date && hasUpdates && (
                                                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                                                    {t('updated')}: {new Date(location.updated_date).toLocaleDateString(language === 'ru' ? 'ru-RU' : language === 'uk' ? 'uk-UA' : language === 'es' ? 'es-ES' : 'en-US', {
                                                        day: 'numeric',
                                                        month: 'long',
                                                        year: 'numeric'
                                                    })}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Must Try */}
                                    {localizedMustTry && (
                                        <div className={`pb-4 border-b dark:border-neutral-700 ${hasUpdates && wasRecentlyUpdated ? 'border-l-4 border-l-blue-500 pl-3' : ''}`}>
                                            <div className="flex items-center gap-2 mb-2">
                                                <h4 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">{t('mustTry')}</h4>
                                                {hasUpdates && wasRecentlyUpdated && (
                                                    <Badge className="bg-blue-500 text-white text-xs ml-auto">
                                                        {t('updated')}
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-neutral-900 dark:text-neutral-300 leading-relaxed text-sm">{localizedMustTry}</p>
                                            {location.updated_date && hasUpdates && (
                                                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                                                    {t('updated')}: {new Date(location.updated_date).toLocaleDateString(language === 'ru' ? 'ru-RU' : language === 'uk' ? 'uk-UA' : language === 'es' ? 'es-ES' : 'en-US', {
                                                        day: 'numeric',
                                                        month: 'long',
                                                        year: 'numeric'
                                                    })}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Address */}
                                    <div className="pb-4 border-b dark:border-neutral-700">
                                        <h4 className="text-neutral-500 dark:text-neutral-400 text-xs font-semibold uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                            <MapPin className="w-3.5 h-3.5" />
                                            {t('address')}
                                        </h4>
                                        <p className="text-neutral-900 dark:text-neutral-300 text-sm mb-2">
                                            {location.address || `${localizedCity}, ${localizedCountry}`}
                                        </p>
                                        {location.latitude && location.longitude && (
                                            <div className="flex flex-wrap gap-2">
                                                <a
                                                    href={`https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-medium transition-colors"
                                                >
                                                    Google Maps →
                                                </a>
                                                <a
                                                    href={`http://maps.apple.com/?daddr=${location.latitude},${location.longitude}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-100 text-neutral-700 hover:bg-neutral-200 rounded-lg text-xs font-medium transition-colors"
                                                >
                                                    Apple Maps →
                                                </a>
                                            </div>
                                        )}
                                    </div>

                                    {/* Contact Information */}
                                    {(location.opening_hours || location.phone || location.booking_url) && (
                                        <div className="space-y-3">
                                            {location.opening_hours && (
                                                <div className="flex items-start gap-2">
                                                    <Clock className="w-4 h-4 text-neutral-500 dark:text-neutral-400 mt-0.5 shrink-0" />
                                                    <div className="flex-1">
                                                        <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('hours')}</p>
                                                        <p className="text-neutral-900 dark:text-neutral-300 text-sm">{location.opening_hours}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {location.phone && (
                                                <div className="flex items-start gap-2">
                                                    <Phone className="w-4 h-4 text-neutral-500 dark:text-neutral-400 mt-0.5 shrink-0" />
                                                    <div className="flex-1">
                                                        <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('phone')}</p>
                                                        <a href={`tel:${location.phone}`} className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm">{location.phone}</a>
                                                    </div>
                                                </div>
                                            )}

                                            {location.booking_url && (
                                                <div className="flex items-start gap-2">
                                                    <Calendar className="w-4 h-4 text-neutral-500 dark:text-neutral-400 mt-0.5 shrink-0" />
                                                    <div className="flex-1">
                                                        <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('booking')}</p>
                                                        <a
                                                            href={location.booking_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm"
                                                        >
                                                            {t('bookNow')} →
                                                        </a>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Social Media Links */}
                                    {location.social_links && location.social_links.length > 0 && (
                                        <div className="pt-4 border-t dark:border-neutral-700">
                                            <div className="flex items-center justify-center gap-4">
                                                {location.social_links.map((link, idx) => {
                                                    const { icon: Icon, color } = getSocialIcon(link);
                                                    return (
                                                        <a
                                                            key={idx}
                                                            href={link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className={`w-12 h-12 rounded-full bg-neutral-50 dark:bg-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-600 flex items-center justify-center transition-all ${color}`}
                                                            aria-label="Social media link"
                                                        >
                                                            <Icon className="w-5 h-5" />
                                                        </a>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="reviews" className="p-6">
                                <ReviewSection locationId={location.id} user={user} />
                            </TabsContent>

                            <TabsContent value="notes" className="p-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 block">
                                            {t('personalNotes')}
                                        </label>
                                        <Textarea
                                            value={note}
                                            onChange={(e) => setNote(e.target.value)}
                                            placeholder={t('addPersonalNotes')}
                                            className="min-h-[200px] resize-none text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700 dark:placeholder:text-neutral-500"
                                        />
                                    </div>
                                    <Button
                                        onClick={handleUpdateNote}
                                        disabled={saving || !note.trim()}
                                        className="w-full rounded-full h-12 bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 disabled:opacity-50"
                                        aria-label={savedLocation ? 'Save note' : 'Save note and add to wishlist'}
                                    >
                                        {savedLocation ? t('saveNote') : t('saveNoteAndAdd')}
                                    </Button>
                                    {!savedLocation && (
                                        <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center">
                                            {t('savingNoteWillAdd')}
                                        </p>
                                    )}

                                    {(user?.role === 'admin' || user?.custom_role === 'admin') && (
                                        <div className="pt-4 border-t dark:border-neutral-700">
                                            <AdminNotesList locationId={location.id} />
                                        </div>
                                    )}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
});

export default LocationCard;