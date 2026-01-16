import React, { useState, useEffect } from 'react';
// import { base44 } from '@/api/base44Client';
import { mockBase44 as base44 } from '@/api/mockBase44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Award, CheckCircle2, XCircle, ChevronRight, Loader2,
    ArrowLeft, MapPin, Star, Trophy, BarChart3, Plus, Clock,
    Heart, Eye, TrendingUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { specialLabels } from '../components/constants';
import CreatorLocationForm from '../components/dashboard/CreatorLocationForm';
import { useLanguage } from '../components/LanguageContext';
import { useTheme } from '../components/ThemeContext';

export default function CreatorTools() {
    const { t } = useLanguage();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('analytics');
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [remainingCount, setRemainingCount] = useState(0);
    const [approvedLocationsCount, setApprovedLocationsCount] = useState(0);
    const [answerType, setAnswerType] = useState(null);
    const [customAnswer, setCustomAnswer] = useState('');
    const [selectedTagsAdd, setSelectedTagsAdd] = useState([]);
    const [selectedTagsRemove, setSelectedTagsRemove] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [showLocationForm, setShowLocationForm] = useState(false);

    const queryClient = useQueryClient();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const userData = await base44.auth.me();
                setUser(userData);

                if (userData.role !== 'creator' && userData.custom_role !== 'creator' && userData.role !== 'admin') {
                    navigate(createPageUrl('Dashboard'));
                    return;
                }

                setLoading(false);
            } catch (e) {
                console.error("Auth error:", e);
                // In demo mode, don't redirect
                // base44.auth.redirectToLogin(window.location.href);
                setLoading(false);
            }
        };

        checkAuth();
    }, [navigate]);

    // Загружаем счетчик задач сразу при загрузке страницы
    const { data: taskCount = 0 } = useQuery({
        queryKey: ['creatorTasksCount', user?.email],
        queryFn: async () => {
            const response = await base44.functions.invoke('getCreatorTasks', {});
            if (response.data.success) {
                return response.data.remainingCount || 0;
            }
            return 0;
        },
        enabled: !!user,
        refetchInterval: 30000
    });

    useEffect(() => {
        setRemainingCount(taskCount);
    }, [taskCount]);

    useEffect(() => {
        if (activeTab === 'moderation' && user) {
            loadNextQuestion();
        }
    }, [activeTab, user]);

    const loadNextQuestion = async () => {
        try {
            const response = await base44.functions.invoke('getCreatorTasks', {});
            if (response.data.success) {
                setCurrentQuestion(response.data.question);
                setCurrentLocation(response.data.location);
                setRemainingCount(response.data.remainingCount || 0);
                resetForm();
            }
        } catch (error) {
            console.error('Error loading next question:', error);
            toast.error('Failed to load next question');
        }
    };

    const resetForm = () => {
        setAnswerType(null);
        setCustomAnswer('');
        setSelectedTagsAdd([]);
        setSelectedTagsRemove([]);
    };

    const handleSubmit = async () => {
        if (!answerType) {
            toast.error('Please select an answer');
            return;
        }

        if (answerType === 'custom' && !customAnswer.trim()) {
            toast.error('Please provide your answer');
            return;
        }

        setSubmitting(true);
        try {
            const response = await base44.functions.invoke('submitCreatorAnswer', {
                review_question_id: currentQuestion.id,
                answer_type: answerType,
                custom_answer: customAnswer,
                proposed_tags_add: selectedTagsAdd,
                proposed_tags_remove: selectedTagsRemove
            });

            if (response.data.success) {
                toast.success(`Answer submitted! +1 point (Total: ${response.data.total_points})`);
                await loadNextQuestion();
            } else {
                // Если success = false в ответе
                const errorMsg = response.data.error || 'Unknown error';
                console.error('Submit failed:', response.data);
                toast.error(`Failed: ${errorMsg}`);
            }
        } catch (error) {
            console.error('Error submitting answer:', error);

            // Извлекаем детальную информацию об ошибке
            let errorMessage = 'Failed to submit answer';

            if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
            } else if (error.data?.error) {
                errorMessage = error.data.error;
            } else if (error.message) {
                errorMessage = error.message;
            }

            console.error('Detailed error:', {
                message: errorMessage,
                fullError: error,
                response: error.response,
                data: error.data
            });

            toast.error(`Error: ${errorMessage}`, { duration: 5000 });
        } finally {
            setSubmitting(false);
        }
    };

    const handleSkip = () => {
        setAnswerType('skip');
        setTimeout(() => handleSubmit(), 100);
    };

    const toggleTagAdd = (tag) => {
        setSelectedTagsAdd(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const toggleTagRemove = (tag) => {
        setSelectedTagsRemove(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const availableTags = specialLabels.filter(
        label => !currentLocation?.special_labels?.includes(label.id)
    );

    // Fetch creator's locations for analytics tab
    const { data: myLocations = [], isLoading: loadingLocations } = useQuery({
        queryKey: ['creatorLocations', user?.email],
        queryFn: async () => {
            const locs = await base44.entities.Location.filter({ created_by: user.email });

            // Подсчитываем новые подтверждения (pending -> published за последние 7 дней)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const recentlyApproved = locs.filter(l => {
                if (l.status !== 'published') return false;
                const updatedDate = new Date(l.updated_date || l.created_date);
                return updatedDate > sevenDaysAgo;
            });

            setApprovedLocationsCount(recentlyApproved.length);

            return locs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
        },
        enabled: !!user
    });

    const { data: savedLocations = [] } = useQuery({
        queryKey: ['allSavedLocations'],
        queryFn: () => base44.entities.SavedLocation.list(),
        enabled: !!user
    });

    const { data: allReviews = [] } = useQuery({
        queryKey: ['allReviews'],
        queryFn: () => base44.entities.Review.list(),
        enabled: !!user
    });

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
        published: CheckCircle2
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F2F2F7] dark:bg-neutral-900 flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            </div>
        );
    }

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    return (
        <div className="min-h-screen bg-[#F2F2F7] dark:bg-neutral-900 pb-8">
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
                            <h1 className="text-lg md:text-2xl font-bold tracking-tight truncate text-neutral-900 dark:text-neutral-100">Creator Tools</h1>
                            <p className="text-xs md:text-sm text-neutral-500 dark:text-neutral-400 hidden sm:block">Manage your content & help improve data</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3">
                        <div className="relative">
                            <Badge className="bg-amber-500 text-white px-2 md:px-3 py-1 md:py-1.5 text-xs md:text-sm">
                                <Trophy className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                                {user?.creator_points || 0}
                            </Badge>
                            {(remainingCount + approvedLocationsCount) > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 bg-red-500 text-white text-[9px] md:text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#F2F2F7]">
                                    {(remainingCount + approvedLocationsCount) > 99 ? '99+' : (remainingCount + approvedLocationsCount)}
                                </span>
                            )}
                        </div>
                        <Button
                            onClick={() => setShowLocationForm(true)}
                            className="rounded-full h-9 md:h-10 px-3 md:px-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shrink-0"
                        >
                            <Plus className="w-4 h-4 md:mr-2" />
                            <span className="hidden md:inline">{t('addLocation')}</span>
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-[1400px] mx-auto px-4 md:px-8 py-4 md:py-8">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="bg-white dark:bg-neutral-800 p-1 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm w-full grid grid-cols-2 gap-0.5 md:h-12">
                        <TabsTrigger
                            value="analytics"
                            className="data-[state=active]:bg-stone-900 dark:data-[state=active]:bg-neutral-100 data-[state=active]:text-white dark:data-[state=active]:text-neutral-900 text-neutral-900 dark:text-neutral-300 rounded-xl h-full flex items-center justify-center text-sm md:text-sm relative"
                        >
                            <BarChart3 className="w-4 h-4 mr-2" />
                            Analytics
                        </TabsTrigger>
                        <TabsTrigger
                            value="moderation"
                            className="data-[state=active]:bg-stone-900 dark:data-[state=active]:bg-neutral-100 data-[state=active]:text-white dark:data-[state=active]:text-neutral-900 text-neutral-900 dark:text-neutral-300 rounded-xl h-full flex items-center justify-center text-sm md:text-sm relative"
                        >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Moderation
                            {remainingCount > 0 && (
                                <span className="ml-2 bg-purple-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                    {remainingCount > 99 ? '99+' : remainingCount}
                                </span>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    {/* Analytics Tab */}
                    <TabsContent value="analytics">
                        <div className="space-y-6">
                            {/* Statistics Cards */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                                <Card className="shadow-sm border-0 dark:bg-neutral-800 dark:border dark:border-neutral-700">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 md:p-6">
                                        <CardTitle className="text-xs md:text-sm font-medium text-neutral-500 dark:text-neutral-400">{t('totalLocations')}</CardTitle>
                                        <MapPin className="w-3 h-3 md:w-4 md:h-4 text-neutral-400 dark:text-neutral-500" />
                                    </CardHeader>
                                    <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
                                        <div className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-neutral-100">{stats.total}</div>
                                        <p className="text-[10px] md:text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                                            {stats.published} {t('publishedTab')?.toLowerCase()} • {stats.pending} {t('pendingTab')?.toLowerCase()}
                                        </p>
                                    </CardContent>
                                </Card>

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
                            </div>

                            {/* Locations List */}
                            <Card className="shadow-sm border-0 dark:bg-neutral-800 dark:border dark:border-neutral-700">
                                <CardHeader className="p-4 md:p-6">
                                    <CardTitle className="flex items-center gap-2 text-base md:text-lg text-neutral-900 dark:text-neutral-100">
                                        <BarChart3 className="w-4 h-4 md:w-5 md:h-5" />
                                        {t('yourLocations')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 md:p-6 pt-0">
                                    <Tabs defaultValue="all" className="w-full">
                                        <TabsList className="grid w-full grid-cols-4 mb-4 md:mb-6 bg-neutral-50 dark:bg-neutral-900 p-1 md:p-1 rounded-xl md:rounded-2xl h-10 md:h-12">
                                            <TabsTrigger
                                                value="all"
                                                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-neutral-900 dark:text-neutral-300 rounded-lg md:rounded-xl text-xs md:text-sm h-full"
                                            >
                                                <span className="hidden sm:inline">{t('allTab')} </span>({stats.total})
                                            </TabsTrigger>
                                            <TabsTrigger
                                                value="published"
                                                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-neutral-900 dark:text-neutral-300 rounded-lg md:rounded-xl text-xs md:text-sm h-full"
                                            >
                                                <span className="hidden sm:inline">{t('publishedTab')} </span>({stats.published})
                                            </TabsTrigger>
                                            <TabsTrigger
                                                value="pending"
                                                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-neutral-900 dark:text-neutral-300 rounded-lg md:rounded-xl text-xs md:text-sm h-full"
                                            >
                                                <span className="hidden sm:inline">{t('pendingTab')} </span>({stats.pending})
                                            </TabsTrigger>
                                            <TabsTrigger
                                                value="draft"
                                                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-neutral-900 dark:text-neutral-300 rounded-lg md:rounded-xl text-xs md:text-sm h-full"
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
                                                                                        <p className="text-xs md:text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
                                                                                            <Clock className="w-4 h-4" />
                                                                                            {t('underReview')}
                                                                                        </p>
                                                                                    </div>
                                                                                )}

                                                                                {location.status === 'published' && (() => {
                                                                                    const sevenDaysAgo = new Date();
                                                                                    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                                                                                    const updatedDate = new Date(location.updated_date || location.created_date);
                                                                                    const isRecentlyApproved = updatedDate > sevenDaysAgo;

                                                                                    if (isRecentlyApproved) {
                                                                                        return (
                                                                                            <div className="p-3 md:p-4 bg-green-50 dark:bg-green-950/30 rounded-xl border-0 dark:border dark:border-green-800 mb-3">
                                                                                                <p className="text-xs md:text-sm text-green-700 dark:text-green-300 flex items-center gap-2 font-medium">
                                                                                                    <CheckCircle2 className="w-4 h-4" />
                                                                                                    Recently approved by admin!
                                                                                                </p>
                                                                                            </div>
                                                                                        );
                                                                                    }
                                                                                    return null;
                                                                                })()}

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
                        </div>
                    </TabsContent>

                    {/* Moderation Tab */}
                    <TabsContent value="moderation">
                        <div className="space-y-6">
                            {!currentQuestion || !currentLocation ? (
                                <Card className="text-center py-12 shadow-sm border-0 dark:bg-neutral-800 dark:border dark:border-neutral-700">
                                    <CardContent>
                                        <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-600 dark:text-green-400" />
                                        <h2 className="text-2xl font-bold mb-2 text-neutral-900 dark:text-neutral-100">All caught up!</h2>
                                        <p className="text-neutral-900 dark:text-neutral-300 mb-6">
                                            No more questions available right now. Check back later!
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={currentQuestion.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        className="space-y-6"
                                    >
                                        {/* Progress */}
                                        <div className="flex items-center justify-between text-sm text-neutral-900 dark:text-neutral-400">
                                            <span>{remainingCount} questions remaining</span>
                                            <Badge variant="outline" className="dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">Question {currentQuestion.field_name}</Badge>
                                        </div>

                                        {/* Location Card */}
                                        <Card className="overflow-hidden shadow-sm border-0 dark:bg-neutral-800 dark:border dark:border-neutral-700">
                                            <div className="relative h-48 md:h-64">
                                                {currentLocation.image_url ? (
                                                    <img
                                                        src={currentLocation.image_url}
                                                        alt={currentLocation.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600" />
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                                                <div className="absolute bottom-4 left-4 right-4">
                                                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                                                        {currentLocation.name}
                                                    </h2>
                                                    <div className="flex items-center gap-4 text-white/90 text-sm">
                                                        <div className="flex items-center gap-1">
                                                            <MapPin className="w-4 h-4" />
                                                            {currentLocation.city}, {currentLocation.country}
                                                        </div>
                                                        {currentLocation.average_rating > 0 && (
                                                            <div className="flex items-center gap-1">
                                                                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                                                {currentLocation.average_rating.toFixed(1)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>

                                        {/* Question Card */}
                                        <Card className="shadow-sm border-0 dark:bg-neutral-800 dark:border dark:border-neutral-700">
                                            <CardHeader>
                                                <CardTitle className="text-lg md:text-xl text-neutral-900 dark:text-neutral-100">
                                                    {currentQuestion.question_text}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-6">
                                                {/* Quote/Context */}
                                                {currentQuestion.suggested_answer_text && (
                                                    <div className="bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-500 dark:border-blue-600 p-4 rounded-r-lg">
                                                        <p className="text-sm italic text-neutral-900 dark:text-blue-200">
                                                            "{currentQuestion.suggested_answer_text}"
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Special Labels (if field is special_labels) */}
                                                {currentQuestion.field_name === 'special_labels' && (
                                                    <div className="space-y-4">
                                                        {/* Current Labels */}
                                                        {currentQuestion.proposed_tags && currentQuestion.proposed_tags.length > 0 && (
                                                            <div>
                                                                <label className="text-sm font-medium text-neutral-900 dark:text-neutral-300 mb-2 block">
                                                                    Current labels (check to remove):
                                                                </label>
                                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                                    {currentQuestion.proposed_tags.map(tagId => {
                                                                        const label = specialLabels.find(l => l.id === tagId);
                                                                        return label ? (
                                                                            <label
                                                                                key={tagId}
                                                                                className="flex items-center gap-2 p-2 border-0 shadow-sm dark:border dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 cursor-pointer bg-white dark:bg-neutral-800"
                                                                            >
                                                                                <Checkbox
                                                                                    checked={selectedTagsRemove.includes(tagId)}
                                                                                    onCheckedChange={() => {
                                                                                        toggleTagRemove(tagId);
                                                                                        if (!answerType) setAnswerType('yes');
                                                                                    }}
                                                                                />
                                                                                <span className="text-sm text-neutral-900 dark:text-neutral-100">{label.emoji} {label.label}</span>
                                                                            </label>
                                                                        ) : null;
                                                                    })}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Available Labels to Add */}
                                                        {availableTags.length > 0 && (
                                                            <div>
                                                                <label className="text-sm font-medium text-neutral-900 dark:text-neutral-300 mb-2 block">
                                                                    Suggest additional labels:
                                                                </label>
                                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                                                                    {availableTags.map(label => (
                                                                        <label
                                                                            key={label.id}
                                                                            className="flex items-center gap-2 p-2 border-0 shadow-sm dark:border dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 cursor-pointer bg-white dark:bg-neutral-800"
                                                                        >
                                                                            <Checkbox
                                                                                checked={selectedTagsAdd.includes(label.id)}
                                                                                onCheckedChange={() => {
                                                                                    toggleTagAdd(label.id);
                                                                                    if (!answerType) setAnswerType('yes');
                                                                                }}
                                                                            />
                                                                            <span className="text-sm text-neutral-900 dark:text-neutral-100">{label.emoji} {label.label}</span>
                                                                        </label>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Answer Buttons */}
                                                {currentQuestion.field_name !== 'special_labels' && (
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <Button
                                                            variant={answerType === 'yes' ? 'default' : 'outline'}
                                                            onClick={() => setAnswerType('yes')}
                                                            className={`h-16 text-lg ${answerType === 'yes' ? 'bg-green-600 hover:bg-green-700' : ''}`}
                                                        >
                                                            <CheckCircle2 className="w-5 h-5 mr-2" />
                                                            Yes
                                                        </Button>
                                                        <Button
                                                            variant={answerType === 'no' ? 'default' : 'outline'}
                                                            onClick={() => setAnswerType('no')}
                                                            className={`h-16 text-lg ${answerType === 'no' ? 'bg-red-600 hover:bg-red-700' : ''}`}
                                                        >
                                                            <XCircle className="w-5 h-5 mr-2" />
                                                            No
                                                        </Button>
                                                    </div>
                                                )}

                                                {/* Custom Answer */}
                                                <div>
                                                    <Button
                                                        variant={answerType === 'custom' ? 'default' : 'outline'}
                                                        onClick={() => setAnswerType(answerType === 'custom' ? null : 'custom')}
                                                        className="w-full mb-3"
                                                    >
                                                        Add your own answer
                                                    </Button>
                                                    {answerType === 'custom' && (
                                                        <Textarea
                                                            value={customAnswer}
                                                            onChange={(e) => setCustomAnswer(e.target.value)}
                                                            placeholder="Write your answer or suggestion..."
                                                            rows={4}
                                                            className="w-full text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700 dark:placeholder:text-neutral-500"
                                                        />
                                                    )}
                                                </div>

                                                {/* Submit Actions */}
                                                <div className="flex gap-3 pt-4 border-t">
                                                    <Button
                                                        variant="ghost"
                                                        onClick={handleSkip}
                                                        disabled={submitting}
                                                        className="flex-1"
                                                    >
                                                        Skip
                                                    </Button>
                                                    <Button
                                                        onClick={handleSubmit}
                                                        disabled={submitting || !answerType}
                                                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                                                    >
                                                        {submitting ? (
                                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                        ) : (
                                                            <ChevronRight className="w-4 h-4 mr-2" />
                                                        )}
                                                        Submit & Next
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                </AnimatePresence>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </main>

            {/* Location Form Modal */}
            {showLocationForm && (
                <CreatorLocationForm
                    isOpen={showLocationForm}
                    onOpenChange={setShowLocationForm}
                    user={user}
                    onSuccess={() => {
                        onSuccess = {() => {
                queryClient.invalidateQueries({ queryKey: ['creatorLocations'] });
            setShowLocationForm(false);
                    }}
                    }}
                />
            )}
        </div>
    );
}