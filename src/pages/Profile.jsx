import React, { useState, useEffect } from 'react';

import { api } from '@/api/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Bell, CreditCard, Trash2, Loader2, Upload, Camera, ArrowLeft, Settings, Heart, Check } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useLanguage } from '../components/LanguageContext';
import { useTheme } from '../components/ThemeContext';
import { Moon, Sun, Monitor, Trophy } from "lucide-react";
import AchievementsList from '../components/achievements/AchievementsList';
import AchievementNotification from '../components/achievements/AchievementNotification';

export default function Profile() {
    const { t } = useLanguage();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState("profile");
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        full_name: '',
        bio: '',
        avatar_url: ''
    });
    const [notificationSettings, setNotificationSettings] = useState({
        email_notifications: true,
        new_locations: true,
        location_updates: true,
        marketing: false
    });
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [deletionRequested, setDeletionRequested] = useState(false);
    const [newAchievement, setNewAchievement] = useState(null);
    const [previousStats, setPreviousStats] = useState(null);

    const queryClient = useQueryClient();

    useEffect(() => {
        const loadUser = async () => {
            try {
                const userData = await api.auth.me();
                setUser(userData);
                setFormData({
                    full_name: userData.full_name || '',
                    bio: userData.bio || '',
                    avatar_url: userData.avatar_url || ''
                });
                setNotificationSettings({
                    email_notifications: true,
                    new_locations: true,
                    location_updates: true,
                    marketing: false,
                    ...userData.notification_settings
                });
                setLoading(false);
            } catch (error) {
                console.error("Auth error:", error);
                setLoading(false);
            }
        };
        loadUser();
    }, []);

    // Sync URL params with active tab
    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && ['profile', 'achievements', 'settings'].includes(tab)) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    const handleTabChange = (value) => {
        setActiveTab(value);
        setSearchParams(prev => {
            prev.set('tab', value);
            return prev;
        });
    };

    const { data: subscriptions = [] } = useQuery({
        queryKey: ['userSubscriptions', user?.email],
        queryFn: () => api.entities.Subscription.filter({ user_email: user.email }),
        enabled: !!user
    });

    const { data: savedLocations = [] } = useQuery({
        queryKey: ['savedLocations', user?.email],
        queryFn: () => api.entities.SavedLocation.filter({ user_email: user.email }),
        enabled: !!user
    });

    const { data: reviews = [] } = useQuery({
        queryKey: ['userReviews', user?.email],
        queryFn: () => api.entities.Review.filter({ user_email: user.email }),
        enabled: !!user
    });

    // Calculate achievement stats
    const achievementStats = React.useMemo(() => {
        const visited = savedLocations.filter(s => s.list_type === 'visited');
        const wishlist = savedLocations.filter(s => s.list_type === 'wishlist');

        return {
            visitedCount: visited.length,
            wishlistCount: wishlist.length,
            citiesVisited: new Set(visited.map(s => s.location_id).map(id =>
                subscriptions.find(sub => sub.id === id)?.city
            ).filter(Boolean)).size,
            countriesVisited: new Set(visited.map(s => s.location_id).map(id =>
                subscriptions.find(sub => sub.id === id)?.country
            ).filter(Boolean)).size,
            reviewsCount: reviews.length
        };
    }, [savedLocations, reviews, subscriptions]);

    // Check for new achievements
    React.useEffect(() => {
        if (previousStats && achievementStats) {
            // Simple achievement detection logic
            const achievements = [
                { id: 'first_visit', check: () => previousStats.visitedCount === 0 && achievementStats.visitedCount >= 1 },
                { id: 'explorer_5', check: () => previousStats.visitedCount < 5 && achievementStats.visitedCount >= 5 },
                { id: 'explorer_10', check: () => previousStats.visitedCount < 10 && achievementStats.visitedCount >= 10 },
                { id: 'explorer_25', check: () => previousStats.visitedCount < 25 && achievementStats.visitedCount >= 25 }
            ];

            const newAch = achievements.find(a => a.check());
            if (newAch) {
                // Import achievements data
                import('../components/achievements/AchievementsList').then(module => {
                    const achData = module.achievements?.find(a => a.id === newAch.id);
                    if (achData) {
                        setNewAchievement(achData);
                    }
                });
            }
        }
        setPreviousStats(achievementStats);
    }, [achievementStats]);

    const visitedCount = savedLocations.filter(s => s.list_type === 'visited').length;
    const wishlistCount = savedLocations.filter(s => s.list_type === 'wishlist').length;

    const { refreshUser } = useAuth(); // Get refresh function from context

    const updateProfileMutation = useMutation({
        mutationFn: (data) => api.auth.updateMe(data),
        onSuccess: async () => {
            toast.success(t('profileUpdated'));
            queryClient.invalidateQueries(['user']);
            await refreshUser(); // Force global auth context to update
        }
    });

    const handleAvatarUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingAvatar(true);
        try {
            const { file_url } = await api.integrations.Core.UploadFile({ file });
            setFormData({ ...formData, avatar_url: file_url });
            await updateProfileMutation.mutateAsync({ avatar_url: file_url });
        } catch (error) {
            console.error(error);
            toast.error(t('avatarUploadError'));
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleSaveProfile = async () => {
        try {
            await updateProfileMutation.mutateAsync({
                full_name: formData.full_name,
                bio: formData.bio,
                avatar_url: formData.avatar_url
            });
        } catch (error) {
            console.error(error);
            toast.error(t('profileSaveError'));
        }
    };

    const handleSaveNotifications = async () => {
        try {
            await updateProfileMutation.mutateAsync({
                notification_settings: notificationSettings
            });
            toast.success(t('notifSettingsSaved'));
        } catch (error) {
            console.error(error);
            toast.error(t('settingsSaveError'));
        }
    };

    const handleRequestDeletion = async () => {
        if (!confirm(t('confirmDeletion'))) {
            return;
        }

        try {
            await api.entities.Feedback.create({
                user_email: user.email,
                user_name: user.full_name,
                type: 'general',
                message: `GDPR: Data deletion request for user ${user.email}. Request date: ${new Date().toISOString()}`,
                status: 'new'
            });
            setDeletionRequested(true);
            toast.success(t('deletionRequestSuccess'));
        } catch (error) {
            console.error(error);
            toast.error(t('requestSubmissionError'));
        }
    };

    const getStatusBadge = (status) => {
        const colors = {
            active: 'bg-green-100 text-green-700',
            expired: 'bg-red-100 text-red-700',
            cancelled: 'bg-neutral-100 text-neutral-700'
        };
        const labels = {
            active: 'Active',
            expired: 'Expired',
            cancelled: 'Cancelled'
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`}>
                {labels[status]}
            </span>
        );
    };

    const getPlanLabel = (plan) => {
        const labels = {
            monthly: 'Monthly',
            yearly: 'Yearly',
            lifetime: 'Lifetime'
        };
        return labels[plan] || plan;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F2F2F7] dark:bg-black flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F2F2F7] dark:bg-black">
            <AchievementNotification
                achievement={newAchievement}
                onClose={() => setNewAchievement(null)}
            />

            {/* Header */}
            <header className="sticky top-0 z-40 bg-white dark:bg-neutral-800 border-b border-neutral-100 dark:border-neutral-700 px-4 md:px-6 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link to={createPageUrl('Dashboard')}>
                            <Button variant="ghost" size="icon" className="rounded-full" aria-label="Back to dashboard">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <h1 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-neutral-100">{t('profileTitle')}</h1>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleTheme}
                        className="rounded-full"
                        aria-label="Toggle theme"
                    >
                        {theme === 'light' && <Sun className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />}
                        {theme === 'dark' && <Moon className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />}
                        {theme === 'system' && <Monitor className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />}
                    </Button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">
                {/* Mobile Stats */}
                <div className="md:hidden grid grid-cols-2 gap-2 mb-3">
                    <Link to={`${createPageUrl('Dashboard')}?tab=done`}>
                        <div className="bg-white dark:bg-neutral-800 rounded-lg p-2 shadow-sm border border-neutral-100 dark:border-neutral-700 cursor-pointer hover:shadow-md transition-all active:scale-95">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                                    <Check className="w-3.5 h-3.5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-green-700 dark:text-green-400 leading-none">{visitedCount}</p>
                                    <p className="text-[9px] text-neutral-500 dark:text-neutral-400 mt-0.5">{t('visited')}</p>
                                </div>
                            </div>
                        </div>
                    </Link>
                    <Link to={`${createPageUrl('Dashboard')}?tab=saved`}>
                        <div className="bg-white dark:bg-neutral-800 rounded-lg p-2 shadow-sm border border-neutral-100 dark:border-neutral-700 cursor-pointer hover:shadow-md transition-all active:scale-95">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                                    <Heart className="w-3.5 h-3.5 text-rose-500" />
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-rose-600 dark:text-rose-400 leading-none">{wishlistCount}</p>
                                    <p className="text-[9px] text-neutral-500 dark:text-neutral-400 mt-0.5">{t('wishlist')}</p>
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>

                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                    <TabsList className="w-full grid grid-cols-3 gap-2 bg-white dark:bg-neutral-800 p-2 rounded-2xl mb-6 h-[52px]">
                        <TabsTrigger
                            value="profile"
                            className="flex items-center justify-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-xl !h-9 !py-0 !px-3 transition-all"
                        >
                            <User className="w-4 h-4" />
                            <span className="font-medium text-sm">{t('profileTab')}</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="achievements"
                            className="flex items-center justify-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-xl !h-9 !py-0 !px-3 transition-all"
                        >
                            <Trophy className="w-4 h-4" />
                            <span className="font-medium text-sm hidden sm:inline">{t('achievements')}</span>
                            <span className="font-medium text-sm sm:hidden">🏆</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="settings"
                            className="flex items-center justify-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-xl !h-9 !py-0 !px-3 transition-all"
                        >
                            <Settings className="w-4 h-4" />
                            <span className="font-medium text-sm">{t('settingsTab')}</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* Profile Tab */}
                    <TabsContent value="profile" className="space-y-6">
                        {/* Avatar Section */}
                        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 md:p-6 shadow-sm border border-neutral-100 dark:border-neutral-700">
                            <div className="flex flex-col items-center gap-4">
                                <div className="relative">
                                    {formData.avatar_url ? (
                                        <img
                                            src={formData.avatar_url}
                                            alt="User avatar"
                                            className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-white shadow-lg ring-4 ring-blue-100"
                                        />
                                    ) : (
                                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-700 dark:to-neutral-600 flex items-center justify-center border-4 border-white dark:border-neutral-800 shadow-lg ring-4 ring-blue-100 dark:ring-blue-900">
                                            <User className="w-16 h-16 md:w-20 md:h-20 text-neutral-400 dark:text-neutral-500" />
                                        </div>
                                    )}
                                    <label className="absolute bottom-0 right-0 w-12 h-12 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 dark:hover:bg-blue-600 transition-all shadow-lg hover:shadow-xl active:scale-95">
                                        {uploadingAvatar ? (
                                            <Loader2 className="w-5 h-5 text-white animate-spin" />
                                        ) : (
                                            <Camera className="w-5 h-5 text-white" />
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleAvatarUpload}
                                            disabled={uploadingAvatar}
                                        />
                                    </label>
                                </div>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('clickToUpload')}</p>
                            </div>
                        </div>

                        {/* Profile Form */}
                        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 md:p-6 shadow-sm border border-neutral-100 dark:border-neutral-700 space-y-6">
                            <div className="bg-neutral-50 dark:bg-black rounded-2xl p-4">
                                <Label className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">Email</Label>
                                <p className="font-medium text-neutral-900 dark:text-neutral-100 break-all">{user?.email || ''}</p>
                                <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">{t('emailCannotChange')}</p>
                            </div>

                            <div>
                                <Label className="mb-2 text-neutral-700 dark:text-neutral-300">{t('yourName')}</Label>
                                <Input
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    placeholder={t('yourName')}
                                    className="h-12 rounded-xl text-neutral-900 dark:bg-black dark:text-neutral-100 dark:border-neutral-700 dark:placeholder:text-neutral-500"
                                />
                            </div>

                            <div>
                                <Label className="mb-2 text-neutral-700 dark:text-neutral-300">{t('aboutYou')}</Label>
                                <Textarea
                                    value={formData.bio}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                    placeholder={t('tellAboutYourself')}
                                    rows={4}
                                    className="rounded-xl text-neutral-900 dark:bg-black dark:text-neutral-100 dark:border-neutral-700 dark:placeholder:text-neutral-500"
                                />
                            </div>

                            <div className="bg-neutral-50 dark:bg-black rounded-2xl p-4">
                                <Label className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">Role</Label>
                                <p className="font-medium text-neutral-900 dark:text-neutral-100">
                                    {user?.role === 'admin' ? 'Administrator' : user?.role === 'creator' || user?.custom_role === 'creator' ? 'Creator' : 'User'}
                                </p>
                            </div>

                            <Button
                                onClick={handleSaveProfile}
                                disabled={updateProfileMutation.isPending}
                                className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 font-medium"
                            >
                                {updateProfileMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : null}
                                {t('saveChanges')}
                            </Button>
                        </div>
                    </TabsContent>

                    {/* Achievements Tab */}
                    <TabsContent value="achievements" className="space-y-6">
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-6 border border-amber-200 dark:border-amber-800">
                            <div className="flex items-center gap-3 mb-4">
                                <Trophy className="w-8 h-8 text-amber-600" />
                                <div>
                                    <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                                        {t('yourAchievements')}
                                    </h3>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                        {t('achievementsDescription')}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-blue-600">{achievementStats.visitedCount}</div>
                                    <div className="text-xs text-neutral-600 dark:text-neutral-400">{t('visited')}</div>
                                </div>
                                <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-rose-600">{achievementStats.wishlistCount}</div>
                                    <div className="text-xs text-neutral-600 dark:text-neutral-400">{t('wishlist')}</div>
                                </div>
                                <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-purple-600">{achievementStats.citiesVisited}</div>
                                    <div className="text-xs text-neutral-600 dark:text-neutral-400">{t('cities')}</div>
                                </div>
                                <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-green-600">{achievementStats.reviewsCount}</div>
                                    <div className="text-xs text-neutral-600 dark:text-neutral-400">{t('reviews')}</div>
                                </div>
                            </div>
                        </div>

                        <AchievementsList stats={achievementStats} />
                    </TabsContent>

                    {/* Settings Tab */}
                    <TabsContent value="settings" className="space-y-6">
                        {/* Notifications */}
                        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 md:p-6 shadow-sm border border-neutral-100 dark:border-neutral-700 space-y-4">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
                                    <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{t('notificationsTitle')}</h2>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between gap-4 p-4 bg-neutral-50 dark:bg-black rounded-xl">
                                    <div>
                                        <Label className="font-semibold text-neutral-900 dark:text-neutral-100">{t('emailNotifications')}</Label>
                                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{t('receiveNotifications')}</p>
                                    </div>
                                    <Switch
                                        checked={notificationSettings.email_notifications}
                                        onCheckedChange={(checked) =>
                                            setNotificationSettings({ ...notificationSettings, email_notifications: checked })
                                        }
                                    />
                                </div>

                                <div className="flex items-center justify-between gap-4 p-4 bg-neutral-50 dark:bg-black rounded-xl">
                                    <div>
                                        <Label className="font-semibold text-neutral-900 dark:text-neutral-100">{t('newLocationsNotif')}</Label>
                                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{t('notifyNewPlaces')}</p>
                                    </div>
                                    <Switch
                                        checked={notificationSettings.new_locations}
                                        onCheckedChange={(checked) =>
                                            setNotificationSettings({ ...notificationSettings, new_locations: checked })
                                        }
                                    />
                                </div>

                                <div className="flex items-center justify-between gap-4 p-4 bg-neutral-50 dark:bg-black rounded-xl">
                                    <div>
                                        <Label className="font-semibold text-neutral-900 dark:text-neutral-100">{t('locationUpdatesNotif')}</Label>
                                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{t('notifySavedChanges')}</p>
                                    </div>
                                    <Switch
                                        checked={notificationSettings.location_updates}
                                        onCheckedChange={(checked) =>
                                            setNotificationSettings({ ...notificationSettings, location_updates: checked })
                                        }
                                    />
                                </div>

                                <div className="flex items-center justify-between gap-4 p-4 bg-neutral-50 dark:bg-black rounded-xl">
                                    <div>
                                        <Label className="font-semibold text-neutral-900 dark:text-neutral-100">{t('marketingNotif')}</Label>
                                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{t('specialOffers')}</p>
                                    </div>
                                    <Switch
                                        checked={notificationSettings.marketing}
                                        onCheckedChange={(checked) =>
                                            setNotificationSettings({ ...notificationSettings, marketing: checked })
                                        }
                                    />
                                </div>
                            </div>

                            <Button
                                onClick={handleSaveNotifications}
                                disabled={updateProfileMutation.isPending}
                                className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 font-medium mt-4"
                            >
                                {t('saveNotifSettings')}
                            </Button>
                        </div>

                        {/* Subscriptions */}
                        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 md:p-6 shadow-sm border border-neutral-100 dark:border-neutral-700">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center">
                                    <CreditCard className="w-5 h-5 text-green-600 dark:text-green-400" />
                                </div>
                                <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{t('subscriptionsTitle')}</h2>
                            </div>

                            {subscriptions.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CreditCard className="w-10 h-10 text-neutral-300 dark:text-neutral-500" />
                                    </div>
                                    <p className="text-neutral-500 dark:text-neutral-400 font-medium">{t('noSubscriptions')}</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {subscriptions.map((sub) => (
                                        <div key={sub.id} className="bg-neutral-50 dark:bg-black rounded-2xl p-5 space-y-3">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="font-bold text-lg text-neutral-900 dark:text-neutral-100">{getPlanLabel(sub.plan)}</p>
                                                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                                                        {new Date(sub.start_date).toLocaleDateString()} - {new Date(sub.end_date).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                {getStatusBadge(sub.status)}
                                            </div>
                                            {sub.amount_paid && (
                                                <div className="pt-3 border-t border-neutral-200 dark:border-neutral-700">
                                                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                                        {t('paidAmount')}: <span className="font-bold text-blue-600 dark:text-blue-400">${sub.amount_paid}</span>
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Data Management */}
                        <div className="space-y-4">
                            {/* Data Deletion */}
                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-2xl p-5 md:p-6 border border-amber-100 dark:border-amber-900 shadow-sm">
                                <div className="flex items-start gap-3">
                                    <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900 rounded-xl flex items-center justify-center shrink-0">
                                        <Trash2 className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-amber-900 dark:text-amber-200 mb-2 text-lg">{t('dataDeletion')}</h3>
                                        <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed mb-3">
                                            {t('dataDeletionDesc')}
                                        </p>
                                        <p className="text-xs text-amber-700 dark:text-amber-400 mb-4">
                                            {t('dataWillBeDeleted')}
                                        </p>
                                        {deletionRequested ? (
                                            <div className="bg-green-100 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-xl p-4">
                                                <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                                                    {t('deletionRequestSubmitted')}
                                                </p>
                                            </div>
                                        ) : (
                                            <Button
                                                variant="destructive"
                                                onClick={handleRequestDeletion}
                                                className="w-full h-12 rounded-xl font-medium"
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                {t('requestDataDeletion')}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Data Export */}
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-2xl p-5 md:p-6 border border-blue-100 dark:border-blue-900 shadow-sm">
                                <div className="flex items-start gap-3">
                                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center shrink-0">
                                        <Upload className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-blue-900 dark:text-blue-200 mb-2 text-lg">{t('dataExportTitle')}</h3>
                                        <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed mb-4">
                                            {t('dataExportDesc')}
                                        </p>
                                        <Button
                                            variant="outline"
                                            onClick={() => toast.info(t('dataExportComingSoon'))}
                                            className="w-full h-12 rounded-xl border-blue-200 dark:border-blue-800 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 hover:border-blue-300 dark:hover:border-blue-700 font-medium"
                                        >
                                            <Upload className="w-4 h-4 mr-2" />
                                            {t('exportMyData')}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}