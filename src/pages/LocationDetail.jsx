import React, { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    MapPin, Star, Heart, Check, ArrowLeft, Sparkles, AlertCircle, Share2,
    Clock, Phone, Calendar, Loader2, Instagram, Facebook, Youtube, Linkedin, Twitter, Globe
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import ReviewSection from '../components/dashboard/ReviewSection';
import { useLanguage } from '../components/LanguageContext';
import { typeLabels, typeColors } from '../components/constants';
import AdminNotesList from '../components/dashboard/AdminNotesList';

export default function LocationDetail() {
    const { language, t } = useLanguage();
    const [locationId, setLocationId] = useState(null);
    const [user, setUser] = useState(null);
    const [note, setNote] = useState('');
    const [saving, setSaving] = useState(false);
    const [viewTracked, setViewTracked] = useState(false);

    const queryClient = useQueryClient();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const userData = await api.auth.me();
                setUser(userData);
            } catch (e) {
                // User not logged in
            }
        };
        checkAuth();

        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');
        setLocationId(id);
    }, []);

    // Track view when page loads
    useEffect(() => {
        const trackView = async () => {
            if (locationId && !viewTracked) {
                try {
                    const currentUser = await api.auth.me().catch(() => null);
                    await api.entities.LocationView.create({
                        location_id: locationId,
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
    }, [locationId, viewTracked]);

    const { data: location, isLoading: loadingLocation } = useQuery({
        queryKey: ['location', locationId],
        queryFn: async () => {
            const locs = await api.entities.Location.filter({ id: locationId });
            const loc = locs[0];
            if (!loc) return null;

            // Проверка доступа: published видны всем, остальные только админам и создателю
            if (loc.status === 'published') return loc;
            if (user?.role === 'admin' || user?.custom_role === 'admin') return loc;
            if (loc.created_by === user?.email) return loc;

            // Если локация не published и пользователь не админ/создатель - не показываем
            return null;
        },
        enabled: !!locationId
    });

    const { data: savedLocations = [] } = useQuery({
        queryKey: ['savedLocations', user?.email],
        queryFn: () => api.entities.SavedLocation.filter({ user_email: user.email }),
        enabled: !!user
    });

    const savedLocation = savedLocations.find(s => s.location_id === locationId);

    const { data: reviews = [] } = useQuery({
        queryKey: ['reviews', locationId],
        queryFn: async () => {
            const allReviews = await api.entities.Review.filter({ location_id: locationId });
            // Filter out hidden reviews for regular users
            return allReviews.filter(r => !r.is_hidden);
        },
        enabled: !!locationId
    });

    const averageRating = reviews.length > 0
        ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
        : 0;

    const saveMutation = useMutation({
        mutationFn: async ({ listType, personalNote }) => {
            const existing = savedLocations.find(s => s.location_id === locationId);
            if (existing) {
                const updateData = { list_type: listType };
                if (typeof personalNote === 'string' && personalNote.trim() !== '') {
                    updateData.personal_note = personalNote;
                }
                return api.entities.SavedLocation.update(existing.id, updateData);
            }
            const createData = {
                user_email: user.email,
                location_id: locationId,
                list_type: listType,
            };
            if (typeof personalNote === 'string' && personalNote.trim() !== '') {
                createData.personal_note = personalNote;
            }
            return api.entities.SavedLocation.create(createData);
        },
        onSuccess: () => queryClient.invalidateQueries(['savedLocations'])
    });

    useEffect(() => {
        if (savedLocation) {
            setNote(savedLocation.personal_note || '');
        }
    }, [savedLocation]);

    const hasUpdates = savedLocation && location?.updated_date &&
        new Date(location.updated_date) > new Date(savedLocation.created_date);

    const wasRecentlyUpdated = location?.updated_date &&
        (Date.now() - new Date(location.updated_date).getTime()) < 7 * 24 * 60 * 60 * 1000;

    const getLocalizedField = (field) => {
        if (!location) return '';
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
        if (lowerUrl.includes('instagram.com')) return { icon: Instagram, color: 'text-pink-600' };
        if (lowerUrl.includes('facebook.com') || lowerUrl.includes('fb.com')) return { icon: Facebook, color: 'text-blue-600' };
        if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return { icon: Youtube, color: 'text-red-600' };
        if (lowerUrl.includes('linkedin.com')) return { icon: Linkedin, color: 'text-blue-700' };
        if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) return { icon: Twitter, color: 'text-sky-600' };
        return { icon: Globe, color: 'text-neutral-600' };
    };

    const handleSave = async (listType) => {
        if (!user) {
            toast.error(t('loginToSave'));
            api.auth.redirectToLogin(window.location.href);
            return;
        }
        setSaving(true);

        // If already saved with the same type, remove it (toggle off)
        if (savedLocation && savedLocation.list_type === listType) {
            await api.entities.SavedLocation.delete(savedLocation.id);
            queryClient.invalidateQueries(['savedLocations']);
            toast.success(listType === 'visited' ? t('removedFromVisited') : t('removedFromWishlist'));
        } else {
            // Otherwise add/update
            await saveMutation.mutateAsync({ listType, personalNote: note });
            toast.success(listType === 'visited' ? t('markedAsVisited') : t('addedToWishlist'));
        }

        setSaving(false);
    };

    const handleUpdateNote = async () => {
        if (!user) {
            toast.error(t('loginToAddNote'));
            api.auth.redirectToLogin(window.location.href);
            return;
        }
        if (!note.trim()) {
            toast.error(t('noteCannotBeEmpty'));
            return;
        }

        setSaving(true);
        if (savedLocation) {
            await api.entities.SavedLocation.update(savedLocation.id, { personal_note: note });
            queryClient.invalidateQueries(['savedLocations']);
            toast.success(t('noteSaved'));
        } else {
            await saveMutation.mutateAsync({ listType: 'wishlist', personalNote: note });
            toast.success(t('noteSavedAndAdded'));
        }
        setSaving(false);
    };

    const handleShare = async () => {
        const shareUrl = window.location.href;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: location.name,
                    text: `${location.name}`,
                    url: shareUrl
                });
            } catch (e) {
                if (e.name !== 'AbortError') {
                    navigator.clipboard.writeText(shareUrl);
                    toast.success(t('linkCopied'));
                }
            }
        } else {
            navigator.clipboard.writeText(shareUrl);
            toast.success(t('linkCopied'));
        }
    };

    if (loadingLocation || !location) {
        return (
            <div className="min-h-screen bg-[#F2F2F7] dark:bg-neutral-900 flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F2F2F7] dark:bg-neutral-900">
            {/* Hero Section */}
            <div className="relative h-[40vh] md:h-[50vh] w-full">
                <img
                    src={location.image_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80"}
                    alt={location.name}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                {/* Back Button */}
                <Link
                    to={(() => {
                        const params = new URLSearchParams(window.location.search);
                        const country = params.get('country');
                        const city = params.get('city');

                        // Build back URL with navigation state
                        const backParams = new URLSearchParams();
                        if (country) backParams.set('country', country);
                        if (city) backParams.set('city', city);

                        return backParams.toString()
                            ? `${createPageUrl('Dashboard')}?${backParams.toString()}`
                            : createPageUrl('Dashboard');
                    })()}
                    className="absolute top-6 left-6 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg z-50"
                    aria-label="Back to dashboard"
                >
                    <ArrowLeft className="w-5 h-5 text-neutral-700" />
                </Link>

                {/* Share Button - Hidden for now */}
                {/* <button 
                    onClick={handleShare}
                    className="absolute top-6 right-6 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg z-50"
                >
                    <Share2 className="w-5 h-5 text-neutral-700" />
                </button> */}

                {/* Title & Location */}
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
                    <div className="max-w-5xl mx-auto">
                        <h1 className="text-4xl md:text-5xl font-bold mb-3 text-white drop-shadow-lg">
                            {location.name}
                        </h1>
                        <div className="flex items-center text-white/95 text-lg">
                            <MapPin className="w-5 h-5 mr-2" />
                            <span className="drop-shadow">{localizedCity}, {localizedCountry}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="sticky top-0 z-40 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 md:px-6 py-3 md:py-4">
                    <div className="flex gap-2 md:gap-3">
                        <Button
                            onClick={() => handleSave('wishlist')}
                            disabled={saving}
                            className={`flex-1 md:flex-none rounded-full h-12 font-medium px-4 md:px-6 ${savedLocation?.list_type === 'wishlist'
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                }`}
                            aria-label="Save to wishlist"
                        >
                            <Heart className={`w-4 h-4 mr-2 shrink-0 ${savedLocation?.list_type === 'wishlist' ? 'fill-current' : ''}`} />
                            <span className="truncate">{savedLocation?.list_type === 'wishlist' ? t('saved') : t('saveToWishlist')}</span>
                        </Button>
                        <Button
                            onClick={() => handleSave('visited')}
                            disabled={saving}
                            variant="outline"
                            className={`flex-1 md:flex-none rounded-full h-12 font-medium px-4 md:px-6 ${savedLocation?.list_type === 'visited' ? 'bg-green-50 text-green-700 border-green-200' : ''
                                }`}
                            aria-label="Mark as visited"
                        >
                            <Check className="w-4 h-4 mr-2 shrink-0" />
                            <span className="truncate">{t('visited')}</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-5xl mx-auto px-6 py-8">
                <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="w-full grid grid-cols-3 bg-neutral-100 dark:bg-neutral-800 rounded-2xl p-1 mb-6">
                        <TabsTrigger
                            value="overview"
                            className="rounded-xl text-neutral-700 dark:text-neutral-300 data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-700 data-[state=active]:text-neutral-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
                        >
                            {t('overview')}
                        </TabsTrigger>
                        <TabsTrigger
                            value="reviews"
                            className="rounded-xl text-neutral-700 dark:text-neutral-300 data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-700 data-[state=active]:text-neutral-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
                        >
                            {t('reviews')} {reviews.length > 0 && `(${reviews.length})`}
                        </TabsTrigger>
                        <TabsTrigger
                            value="notes"
                            className="rounded-xl text-neutral-700 dark:text-neutral-300 data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-700 data-[state=active]:text-neutral-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
                        >
                            {t('myNotes')}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        {/* Badges & Rating */}
                        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm">
                            {/* Main badges */}
                            <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-3">
                                <Badge className={typeColors[location.type]}>
                                    {typeLabels[location.type] || location.type}
                                </Badge>
                                {location.is_hidden_gem && (
                                    <Badge className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                                        <Star className="w-3 h-3 mr-1 fill-current" />
                                        {t('hiddenGem')}
                                    </Badge>
                                )}
                                {location.price_range && (
                                    <Badge className="bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 text-sm font-semibold">
                                        {location.price_range}
                                    </Badge>
                                )}
                            </div>

                            {/* Special labels */}
                            {location.special_labels && location.special_labels.length > 0 && (
                                <div className="flex flex-wrap items-center gap-2 mb-4">
                                    {location.special_labels.map(label => (
                                        <Badge key={label} className="bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 text-xs">
                                            {t(label)}
                                        </Badge>
                                    ))}
                                </div>
                            )}

                            {reviews.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <div className="flex gap-0.5">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`w-5 h-5 ${i < Math.round(averageRating) ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'}`}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{averageRating}</span>
                                    <span className="text-neutral-700 dark:text-neutral-300">({reviews.length} {t('reviews')})</span>
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        {localizedDescription && (
                            <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm">
                                <h3 className="text-lg font-semibold mb-3 text-neutral-900 dark:text-neutral-100">{t('about')}</h3>
                                <p className="text-neutral-900 dark:text-neutral-200 leading-relaxed">
                                    {localizedDescription}
                                </p>
                            </div>
                        )}

                        {/* Curator's Tip */}
                        {localizedInsiderTip && (
                            <div className={`bg-purple-50 dark:bg-purple-950/30 rounded-2xl p-6 relative shadow-sm ${hasUpdates && wasRecentlyUpdated ? 'ring-2 ring-blue-400 ring-offset-2' : ''}`}>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                                        <Sparkles className="w-5 h-5 text-white" />
                                    </div>
                                    <h4 className="font-semibold text-purple-900 dark:text-purple-300 text-lg">{t('curatorsTip')}</h4>
                                    {hasUpdates && wasRecentlyUpdated && (
                                        <Badge className="bg-blue-500 text-white text-xs ml-auto">
                                            {t('updated')}
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-purple-900 dark:text-purple-200 italic leading-relaxed text-base">
                                    "{localizedInsiderTip}"
                                </p>
                                {location.updated_date && hasUpdates && (
                                    <p className="text-xs text-purple-600 mt-2">
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
                            <div className={`bg-amber-50 dark:bg-amber-950/30 rounded-2xl p-6 shadow-sm ${hasUpdates && wasRecentlyUpdated ? 'ring-2 ring-blue-400 ring-offset-2' : ''}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-semibold text-amber-900 dark:text-amber-300 text-lg">{t('mustTry')}</h4>
                                    {hasUpdates && wasRecentlyUpdated && (
                                        <Badge className="bg-blue-500 text-white text-xs">
                                            {t('updated')}
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-amber-900 dark:text-amber-200 leading-relaxed text-base">{localizedMustTry}</p>
                                {location.updated_date && hasUpdates && (
                                    <p className="text-xs text-amber-700 mt-2">
                                        {t('updated')}: {new Date(location.updated_date).toLocaleDateString(language === 'ru' ? 'ru-RU' : language === 'uk' ? 'uk-UA' : language === 'es' ? 'es-ES' : 'en-US', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric'
                                        })}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Address & Navigation */}
                        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm">
                            <h4 className="text-neutral-500 dark:text-neutral-400 text-sm font-semibold uppercase tracking-wide mb-3">
                                {t('address')}
                            </h4>
                            <p className="text-neutral-900 dark:text-neutral-100 mb-4 text-base">
                                {location.address || `${localizedCity}, ${localizedCountry}`}
                            </p>
                            {location.latitude && location.longitude && (
                                <div className="flex flex-wrap gap-3">
                                    <a
                                        href={`https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-sm font-medium transition-colors"
                                    >
                                        <MapPin className="w-4 h-4" />
                                        {t('routeInGoogleMaps')}
                                    </a>
                                    <a
                                        href={`http://maps.apple.com/?daddr=${location.latitude},${location.longitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-neutral-50 text-neutral-700 hover:bg-neutral-100 rounded-xl text-sm font-medium transition-colors"
                                    >
                                        <MapPin className="w-4 h-4" />
                                        {t('routeInAppleMaps')}
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* Social Media Links */}
                        {location.social_links && location.social_links.length > 0 && (
                            <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm">
                                <h4 className="text-neutral-500 dark:text-neutral-400 text-sm font-semibold uppercase tracking-wide mb-4">
                                    {t('socialMedia') || 'Социальные сети'}
                                </h4>
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

                        {/* Additional Info */}
                        {(location.opening_hours || location.phone || location.website || location.booking_url) && (
                            <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm space-y-4">
                                <h4 className="text-neutral-500 dark:text-neutral-400 text-sm font-semibold uppercase tracking-wide">
                                    {t('additionalInfo')}
                                </h4>

                                {location.opening_hours && (
                                    <div className="flex items-start gap-3">
                                        <Clock className="w-5 h-5 text-neutral-500 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">{t('hours')}</p>
                                            <p className="text-neutral-900 dark:text-neutral-100">{location.opening_hours}</p>
                                        </div>
                                    </div>
                                )}

                                {location.phone && (
                                    <div className="flex items-start gap-3">
                                        <Phone className="w-5 h-5 text-neutral-500 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">{t('phone')}</p>
                                            <a href={`tel:${location.phone}`} className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">{location.phone}</a>
                                        </div>
                                    </div>
                                )}

                                {location.website && (
                                    <div className="flex items-start gap-3">
                                        <Globe className="w-5 h-5 text-neutral-500 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">{t('website')}</p>
                                            <a
                                                href={location.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                                            >
                                                {location.website}
                                            </a>
                                        </div>
                                    </div>
                                )}

                                {location.booking_url && (
                                    <div className="flex items-start gap-3">
                                        <Calendar className="w-5 h-5 text-neutral-500 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">{t('booking')}</p>
                                            <a
                                                href={location.booking_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                                            >
                                                {t('bookNow')} →
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="reviews">
                        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm">
                            <ReviewSection locationId={locationId} user={user} />
                        </div>
                    </TabsContent>

                    <TabsContent value="notes">
                        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm space-y-4">
                            <div>
                                <label className="text-sm font-medium text-neutral-900 dark:text-neutral-300 mb-2 block">
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
                                className="w-full rounded-full h-12 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50"
                                aria-label={savedLocation ? 'Save note' : 'Save note and add to wishlist'}
                            >
                                {savedLocation ? t('saveNote') : t('saveNoteAndAdd')}
                            </Button>
                            {!savedLocation && (
                                <p className="text-xs text-neutral-700 dark:text-neutral-400 text-center">
                                    {t('savingNoteWillAdd')}
                                </p>
                            )}

                            {(user?.role === 'admin' || user?.custom_role === 'admin') && (
                                <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
                                    <AdminNotesList locationId={locationId} />
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}