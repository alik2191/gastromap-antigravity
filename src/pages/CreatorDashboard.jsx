import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Plus, MapPin, Clock, CheckCircle, XCircle, Eye, Heart, 
    Star, TrendingUp, BarChart3, Loader2, ArrowLeft
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import CreatorLocationForm from '../components/dashboard/CreatorLocationForm';
import { useLanguage } from '../components/LanguageContext';

export default function CreatorDashboard() {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showLocationForm, setShowLocationForm] = useState(false);
    const queryClient = useQueryClient();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const userData = await base44.auth.me();
                setUser(userData);
                
                // Check if user is creator
                if (userData.role !== 'creator' && userData.custom_role !== 'creator') {
                    navigate(createPageUrl('Dashboard'));
                    return;
                }
                
                setLoading(false);
            } catch (e) {
                base44.auth.redirectToLogin(window.location.href);
            }
        };
        
        checkAuth();
    }, [navigate]);

    // Fetch creator's locations
    const { data: myLocations = [], isLoading: loadingLocations } = useQuery({
        queryKey: ['creatorLocations', user?.email],
        queryFn: async () => {
            const locs = await base44.entities.Location.filter({ created_by: user.email });
            return locs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
        },
        enabled: !!user
    });

    // Fetch saved locations for analytics
    const { data: savedLocations = [] } = useQuery({
        queryKey: ['allSavedLocations'],
        queryFn: () => base44.entities.SavedLocation.list(),
        enabled: !!user
    });

    // Fetch reviews for analytics
    const { data: allReviews = [] } = useQuery({
        queryKey: ['allReviews'],
        queryFn: () => base44.entities.Review.list(),
        enabled: !!user
    });

    // Calculate analytics for each location
    const locationsWithAnalytics = myLocations.map(location => {
        const saves = savedLocations.filter(s => s.location_id === location.id).length;
        const reviews = allReviews.filter(r => r.location_id === location.id);
        const reviewsCount = reviews.length;
        const avgRating = reviewsCount > 0 
            ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviewsCount).toFixed(1)
            : 0;

        return {
            ...location,
            saves,
            reviewsCount,
            avgRating
        };
    });

    // Statistics
    const stats = {
        total: myLocations.length,
        published: myLocations.filter(l => l.status === 'published').length,
        pending: myLocations.filter(l => l.status === 'pending').length,
        draft: myLocations.filter(l => l.status === 'draft').length,
        totalSaves: locationsWithAnalytics.reduce((sum, l) => sum + l.saves, 0),
        totalReviews: locationsWithAnalytics.reduce((sum, l) => sum + l.reviewsCount, 0),
    };

    const statusColors = {
        draft: 'bg-neutral-100 text-neutral-700',
        pending: 'bg-amber-100 text-amber-700',
        published: 'bg-green-100 text-green-700'
    };

    const statusIcons = {
        draft: Clock,
        pending: Clock,
        published: CheckCircle
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F2F2F7] flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F2F2F7] dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 pb-10 font-sans">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-[#F2F2F7]/90 dark:bg-neutral-900/90 backdrop-blur-xl border-b border-white/20 dark:border-neutral-800 pt-4 md:pt-6 pb-3 md:pb-4 px-4 md:px-8">
                <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 md:gap-4 min-w-0">
                        <Link to={createPageUrl("Dashboard")}>
                            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 md:h-10 md:w-10 shrink-0">
                                <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
                            </Button>
                        </Link>
                        <div className="min-w-0">
                            <h1 className="text-lg md:text-2xl font-bold tracking-tight truncate text-neutral-900 dark:text-neutral-100">{t('creatorDashboard')}</h1>
                            <p className="text-xs md:text-sm text-neutral-500 dark:text-neutral-400 hidden sm:block">{t('manageSubmissions')}</p>
                        </div>
                    </div>
                    <Button 
                        onClick={() => setShowLocationForm(true)}
                        className="rounded-full h-9 md:h-10 px-3 md:px-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shrink-0"
                    >
                        <Plus className="w-4 h-4 md:mr-2" />
                        <span className="hidden md:inline">{t('addLocation')}</span>
                    </Button>
                </div>
            </header>

            <main className="max-w-[1400px] mx-auto px-4 md:px-8 py-4 md:py-8">
                {/* Statistics Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <Card className="shadow-sm border-0 dark:bg-neutral-800 dark:border dark:border-neutral-700">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 md:p-6">
                                <CardTitle className="text-xs md:text-sm font-medium text-neutral-500 dark:text-neutral-400">{t('totalLocations')}</CardTitle>
                                <MapPin className="w-3 h-3 md:w-4 md:h-4 text-neutral-400 dark:text-neutral-500" />
                            </CardHeader>
                            <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
                                <div className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-neutral-100">{stats.total}</div>
                                <p className="text-[10px] md:text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                                    {stats.published} {t('publishedTab').toLowerCase()} • {stats.pending} {t('pendingTab').toLowerCase()}
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Card className="shadow-sm border-0 dark:bg-neutral-800 dark:border dark:border-neutral-700">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 md:p-6">
                                <CardTitle className="text-xs md:text-sm font-medium text-neutral-500 dark:text-neutral-400">{t('totalSaves')}</CardTitle>
                                <Heart className="w-3 h-3 md:w-4 md:h-4 text-neutral-400 dark:text-neutral-500" />
                            </CardHeader>
                            <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
                                <div className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-neutral-100">{stats.totalSaves}</div>
                                <p className="text-[10px] md:text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                                    {t('usersWhoSaved')}
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <Card className="shadow-sm border-0 dark:bg-neutral-800 dark:border dark:border-neutral-700">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 md:p-6">
                                <CardTitle className="text-xs md:text-sm font-medium text-neutral-500 dark:text-neutral-400">{t('totalReviews')}</CardTitle>
                                <Star className="w-3 h-3 md:w-4 md:h-4 text-neutral-400 dark:text-neutral-500" />
                            </CardHeader>
                            <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
                                <div className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-neutral-100">{stats.totalReviews}</div>
                                <p className="text-[10px] md:text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                                    {t('userReviewsReceived')}
                                </p>
            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <Card className="shadow-sm border-0 dark:bg-neutral-800 dark:border dark:border-neutral-700">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 md:p-6">
                                <CardTitle className="text-xs md:text-sm font-medium text-neutral-500 dark:text-neutral-400">{t('engagementRate')}</CardTitle>
                                <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-neutral-400 dark:text-neutral-500" />
                            </CardHeader>
                            <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
                                <div className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                                    {stats.published > 0 
                                        ? ((stats.totalSaves + stats.totalReviews) / stats.published).toFixed(1)
                                        : '0.0'
                                    }
                                </div>
                                <p className="text-[10px] md:text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                                    {t('avgInteractions')}
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* Locations List with Tabs */}
                <Card className="shadow-sm border-0 dark:bg-neutral-800 dark:border dark:border-neutral-700">
                    <CardHeader className="p-4 md:p-6">
                        <CardTitle className="flex items-center gap-2 text-base md:text-lg text-neutral-900 dark:text-neutral-100">
                            <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-neutral-900 dark:text-neutral-100" />
                            {t('yourLocations')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 md:p-6 pt-0">
                        <Tabs defaultValue="all" className="w-full">
                            <TabsList className="grid w-full grid-cols-4 mb-4 md:mb-6 bg-neutral-50 dark:bg-neutral-900 p-1 md:p-1 rounded-xl md:rounded-2xl h-10 md:h-12">
                                <TabsTrigger 
                                    value="all"
                                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white dark:text-neutral-300 rounded-lg md:rounded-xl text-xs md:text-sm h-full"
                                >
                                    <span className="hidden sm:inline">{t('allTab')} </span>({stats.total})
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="published"
                                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white dark:text-neutral-300 rounded-lg md:rounded-xl text-xs md:text-sm h-full"
                                >
                                    <span className="hidden sm:inline">{t('publishedTab')} </span>({stats.published})
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="pending"
                                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white dark:text-neutral-300 rounded-lg md:rounded-xl text-xs md:text-sm h-full"
                                >
                                    <span className="hidden sm:inline">{t('pendingTab')} </span>({stats.pending})
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="draft"
                                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white dark:text-neutral-300 rounded-lg md:rounded-xl text-xs md:text-sm h-full"
                                >
                                    <span className="hidden sm:inline">{t('draftTab')} </span>({stats.draft})
                                </TabsTrigger>
                            </TabsList>

                            {['all', 'published', 'pending', 'draft'].map(tab => (
                                <TabsContent key={tab} value={tab} className="space-y-3 md:space-y-4">
                                    {loadingLocations ? (
                                        <div className="flex justify-center py-10">
                                            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                                        </div>
                                    ) : (
                                        <>
                                            {locationsWithAnalytics
                                                .filter(l => tab === 'all' || l.status === tab)
                                                .map(location => {
                                                    const StatusIcon = statusIcons[location.status];
                                                    return (
                                                        <div 
                                                           key={location.id}
                                                           className="shadow-sm border-0 dark:border dark:border-neutral-700 rounded-2xl p-4 md:p-6 hover:shadow-md transition-all bg-white dark:bg-neutral-800"
                                                        >
                                                            <div className="flex items-start justify-between gap-3 md:gap-4">
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                                                                        <h3 className="text-base md:text-lg font-semibold truncate text-neutral-900 dark:text-neutral-100">{location.name}</h3>
                                                                        <Badge className={`${statusColors[location.status]} text-xs shrink-0`}>
                                                                            <StatusIcon className="w-3 h-3 mr-1" />
                                                                            <span className="hidden sm:inline">{location.status}</span>
                                                                        </Badge>
                                                                    </div>
                                                                    
                                                                    <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-neutral-500 dark:text-neutral-400 mb-3 md:mb-4">
                                                                        <span className="flex items-center gap-1">
                                                                            <MapPin className="w-3 h-3 md:w-4 md:h-4" />
                                                                            <span className="truncate">{location.city}, {location.country}</span>
                                                                        </span>
                                                                        <span className="flex items-center gap-1">
                                                                            <Clock className="w-3 h-3 md:w-4 md:h-4" />
                                                                            {new Date(location.created_date).toLocaleDateString()}
                                                                        </span>
                                                                    </div>

                                                                    {location.status === 'published' && (
                                                                        <div className="flex flex-wrap items-center gap-3 md:gap-6 p-3 md:p-4 bg-neutral-50 dark:bg-neutral-900 rounded-xl">
                                                                            <div className="flex items-center gap-1.5 md:gap-2">
                                                                                <Heart className="w-3 h-3 md:w-4 md:h-4 text-rose-500" />
                                                                                <span className="text-xs md:text-sm font-medium">{location.saves}</span>
                                                                            </div>
                                                                            <div className="flex items-center gap-1.5 md:gap-2">
                                                                                <Star className="w-3 h-3 md:w-4 md:h-4 text-amber-500" />
                                                                                <span className="text-xs md:text-sm font-medium">
                                                                                    {location.avgRating > 0 ? location.avgRating : 'N/A'}
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex items-center gap-1.5 md:gap-2">
                                                                                <Eye className="w-3 h-3 md:w-4 md:h-4 text-blue-500" />
                                                                                <span className="text-xs md:text-sm font-medium">{location.reviewsCount}</span>
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {location.status === 'pending' && (
                                                                        <div className="p-3 md:p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border-0 dark:border dark:border-amber-800">
                                                                            <p className="text-xs md:text-sm text-amber-700 dark:text-amber-300">
                                                                                {t('underReview')}
                                                                            </p>
                                                                        </div>
                                                                    )}

                                                                    {location.status === 'draft' && (
                                                                        <div className="p-3 md:p-4 bg-neutral-50 dark:bg-neutral-900 rounded-xl border-0 dark:border dark:border-neutral-700">
                                                                            <p className="text-xs md:text-sm text-neutral-900 dark:text-neutral-300">
                                                                                {t('savedAsDraft')}
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {location.image_url && (
                                                                    <img 
                                                                        src={location.image_url} 
                                                                        alt={location.name}
                                                                        className="w-20 h-20 md:w-32 md:h-32 object-cover rounded-xl shrink-0"
                                                                    />
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}

                                            {locationsWithAnalytics.filter(l => tab === 'all' || l.status === tab).length === 0 && (
                                                <div className="text-center py-12">
                                                    <MapPin className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
                                                    <p className="text-neutral-500 dark:text-neutral-400">{t('noLocationsInCategory')}</p>
                                                    <Button 
                                                        onClick={() => setShowLocationForm(true)}
                                                        className="mt-4"
                                                        variant="outline"
                                                    >
                                                        {t('addFirstLocation')}
                                                    </Button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </TabsContent>
                            ))}
                        </Tabs>
                    </CardContent>
                </Card>
            </main>

            {/* Location Form Modal */}
            {showLocationForm && (
                <CreatorLocationForm 
                    isOpen={showLocationForm}
                    onOpenChange={setShowLocationForm}
                    user={user}
                    onSuccess={() => {
                        queryClient.invalidateQueries(['creatorLocations']);
                        setShowLocationForm(false);
                    }}
                />
            )}
        </div>
    );
}