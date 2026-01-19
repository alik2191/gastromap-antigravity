import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { subDays } from 'date-fns';

// Import dashboard cards
import LocationsHubCard from './dashboard/LocationsHubCard';
import UsersRevenueCard from './dashboard/UsersRevenueCard';
import AIHealthCard from './dashboard/AIHealthCard';
import EngagementCard from './dashboard/EngagementCard';
import SystemStatsCard from './dashboard/SystemStatsCard';
import QuickActionsPanel from './dashboard/QuickActionsPanel';

export default function NewDashboardTab({
    onAddLocation,
    onInviteUser,
    onSwitchTab,
    onOpenSettings
}) {
    // Fetch all necessary data
    const { data: locations = [], isLoading: loadingLocations } = useQuery({
        queryKey: ['admin-dashboard-locations'],
        queryFn: () => api.entities.Location.list()
    });

    const { data: users = [], isLoading: loadingUsers } = useQuery({
        queryKey: ['admin-dashboard-users'],
        queryFn: () => api.entities.User.list()
    });

    const { data: subscriptions = [], isLoading: loadingSubs } = useQuery({
        queryKey: ['admin-dashboard-subs'],
        queryFn: () => api.entities.Subscription.list()
    });

    const { data: aiAgents = [], isLoading: loadingAI } = useQuery({
        queryKey: ['admin-dashboard-ai'],
        queryFn: () => api.entities.AIAgent.list()
    });

    const { data: reviews = [], isLoading: loadingReviews } = useQuery({
        queryKey: ['admin-dashboard-reviews'],
        queryFn: () => api.entities.Review.list()
    });

    const { data: feedback = [], isLoading: loadingFeedback } = useQuery({
        queryKey: ['admin-dashboard-feedback'],
        queryFn: () => api.entities.Feedback.list()
    });

    const { data: systemLogs = [], isLoading: loadingLogs } = useQuery({
        queryKey: ['admin-dashboard-logs'],
        queryFn: () => api.entities.SystemLog.list()
    });

    // Calculate all metrics
    const metrics = useMemo(() => {
        // Locations metrics
        const totalLocations = locations.length;
        const pendingLocations = locations.filter(l => l.status === 'pending' || l.status === 'draft').length;
        const activeLocations = locations.filter(l => l.status === 'active').length;

        // Users metrics
        const totalUsers = users.length;
        const thirtyDaysAgo = subDays(new Date(), 30);
        const newUsers30d = users.filter(u => new Date(u.created_at) > thirtyDaysAgo).length;
        const sixtyDaysAgo = subDays(new Date(), 60);
        const previousMonthUsers = users.filter(u => {
            const created = new Date(u.created_at);
            return created > sixtyDaysAgo && created <= thirtyDaysAgo;
        }).length;
        const newUsersGrowth = previousMonthUsers > 0
            ? Math.round(((newUsers30d - previousMonthUsers) / previousMonthUsers) * 100)
            : 0;

        // Revenue metrics (MRR - Monthly Recurring Revenue)
        const activeSubs = subscriptions.filter(s => s.status === 'active');
        const monthlyRevenue = activeSubs.reduce((sum, sub) => {
            // Assuming pricing: basic = $9, pro = $19, enterprise = $49
            const prices = { basic: 9, pro: 19, enterprise: 49 };
            return sum + (prices[sub.plan] || 0);
        }, 0);

        // Mock revenue change (in real app, compare with previous month)
        const revenueChange = Math.round(monthlyRevenue * 0.15); // 15% growth mock

        // AI Health metrics
        const aiAgent = aiAgents[0] || {};
        const aiStatus = aiAgent.status || 'unknown';
        const scheduledTasks = aiAgent.scheduled_tasks?.length || 0;
        const aiErrors = systemLogs.filter(l =>
            l.level === 'ERROR' &&
            l.source?.includes('ai') &&
            new Date(l.created_at) > subDays(new Date(), 1)
        ).length;

        // Engagement metrics
        const newReviews = reviews.filter(r =>
            !r.is_read && new Date(r.created_at) > subDays(new Date(), 7)
        ).length;
        const newMessages = feedback.filter(f => !f.is_read).length;
        const averageRating = locations.length > 0
            ? locations.reduce((sum, l) => sum + (l.rating || 0), 0) / locations.length
            : 0;

        // System stats
        const topLocation = locations.length > 0
            ? locations.reduce((max, loc) =>
                (loc.views || 0) > (max.views || 0) ? loc : max
            )
            : null;
        const topLocationViews = topLocation?.views || 0;

        // Next AI update (mock - in real app, get from AI agent schedule)
        const nextAIUpdate = aiAgent.next_run
            ? `in ${Math.round((new Date(aiAgent.next_run) - new Date()) / (1000 * 60))}m`
            : 'Not scheduled';

        return {
            // Locations
            totalLocations,
            pendingLocations,
            activeLocations,
            nextAIUpdate,

            // Users & Revenue
            totalUsers,
            newUsers30d,
            newUsersGrowth,
            monthlyRevenue,
            revenueChange,

            // AI Health
            aiStatus,
            scheduledTasks,
            aiErrors,

            // Engagement
            newReviews,
            newMessages,
            averageRating,

            // System
            topLocationName: topLocation?.name || 'N/A',
            topLocationViews,
            storageUsed: 2.3, // Mock
            storageTotal: 10
        };
    }, [locations, users, subscriptions, aiAgents, reviews, feedback, systemLogs]);

    const isLoading = loadingLocations || loadingUsers || loadingSubs ||
        loadingAI || loadingReviews || loadingFeedback || loadingLogs;

    return (
        <div className="space-y-4">
            {/* Hero + Medium Card Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                    <LocationsHubCard
                        totalLocations={metrics.totalLocations}
                        pendingLocations={metrics.pendingLocations}
                        activeLocations={metrics.activeLocations}
                        nextAIUpdate={metrics.nextAIUpdate}
                        onAddLocation={onAddLocation}
                        isLoading={isLoading}
                    />
                </div>
                <UsersRevenueCard
                    totalUsers={metrics.totalUsers}
                    newUsers30d={metrics.newUsers30d}
                    newUsersGrowth={metrics.newUsersGrowth}
                    monthlyRevenue={metrics.monthlyRevenue}
                    revenueChange={metrics.revenueChange}
                    isLoading={isLoading}
                />
            </div>

            {/* Three Small Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <AIHealthCard
                    status={metrics.aiStatus}
                    scheduledTasks={metrics.scheduledTasks}
                    errorCount={metrics.aiErrors}
                    onSettingsClick={() => onSwitchTab('ai-management')}
                    isLoading={isLoading}
                />
                <EngagementCard
                    newReviews={metrics.newReviews}
                    newMessages={metrics.newMessages}
                    averageRating={metrics.averageRating}
                    isLoading={isLoading}
                />
                <SystemStatsCard
                    topLocation={metrics.topLocationName}
                    topLocationViews={metrics.topLocationViews}
                    storageUsed={metrics.storageUsed}
                    storageTotal={metrics.storageTotal}
                    isLoading={isLoading}
                />
            </div>

            {/* Quick Actions */}
            <QuickActionsPanel
                onInviteUser={onInviteUser}
                onReviewLocations={() => onSwitchTab('moderation')}
                onManageSubscriptions={() => onSwitchTab('subscriptions')}
                onViewAnalytics={() => onSwitchTab('analytics')}
                onOpenSettings={onOpenSettings}
                pendingLocationsCount={metrics.pendingLocations}
                isLoading={isLoading}
            />
        </div>
    );
}
