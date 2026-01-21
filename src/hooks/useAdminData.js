import { useQuery } from '@tanstack/react-query';
import { adapter } from '@/api/supabaseAdapter';

/**
 * Custom hook for fetching admin data
 * Centralizes all data fetching logic from Admin.jsx
 * @returns {Object} Admin data and loading states
 * @property {Array} locations - All locations
 * @property {Array} users - All users
 * @property {Array} subscriptions - All subscriptions
 * @property {Array} feedback - All feedback
 * @property {Array} reviews - All reviews
 * @property {Array} aiAgents - All AI agents
 * @property {Array} systemLogs - All system logs
 * @property {Array} chatMessages - All chat messages
 * @property {boolean} isLoading - Combined loading state
 * @property {Error|null} error - Combined error state
 * @property {Function} refetchAll - Refetch all data
 * @example
 * const { locations, isLoading, refetchAll } = useAdminData();
 */
export function useAdminData() {
    // Fetch locations
    const {
        data: locations = [],
        isLoading: isLoadingLocations,
        error: locationsError,
        refetch: refetchLocations,
    } = useQuery({
        queryKey: ['locations'],
        queryFn: () => adapter.entities.Location.list(),
    });

    // Fetch users
    const {
        data: users = [],
        isLoading: isLoadingUsers,
        error: usersError,
        refetch: refetchUsers,
    } = useQuery({
        queryKey: ['users'],
        queryFn: () => adapter.entities.User.list(),
    });

    // Fetch subscriptions
    const {
        data: subscriptions = [],
        isLoading: isLoadingSubscriptions,
        error: subscriptionsError,
        refetch: refetchSubscriptions,
    } = useQuery({
        queryKey: ['subscriptions'],
        queryFn: () => adapter.entities.Subscription.list(),
    });

    // Fetch feedback
    const {
        data: feedback = [],
        isLoading: isLoadingFeedback,
        error: feedbackError,
        refetch: refetchFeedback,
    } = useQuery({
        queryKey: ['feedback'],
        queryFn: () => adapter.entities.Feedback.list(),
    });

    // Fetch reviews
    const {
        data: reviews = [],
        isLoading: isLoadingReviews,
        error: reviewsError,
        refetch: refetchReviews,
    } = useQuery({
        queryKey: ['reviews'],
        queryFn: () => adapter.entities.Review.list(),
    });

    // Fetch AI agents
    const {
        data: aiAgents = [],
        isLoading: isLoadingAIAgents,
        error: aiAgentsError,
        refetch: refetchAIAgents,
    } = useQuery({
        queryKey: ['aiAgents'],
        queryFn: () => adapter.entities.AIAgent.list(),
    });

    // Fetch system logs
    const {
        data: systemLogs = [],
        isLoading: isLoadingSystemLogs,
        error: systemLogsError,
        refetch: refetchSystemLogs,
    } = useQuery({
        queryKey: ['systemLogs'],
        queryFn: () => adapter.entities.SystemLog.list({ column: 'created_at', ascending: false }),
    });

    // Fetch chat messages
    const {
        data: chatMessages = [],
        isLoading: isLoadingChatMessages,
        error: chatMessagesError,
        refetch: refetchChatMessages,
    } = useQuery({
        queryKey: ['chatMessages'],
        queryFn: () => adapter.entities.ChatMessage.list(),
    });

    // Combined loading state
    const isLoading =
        isLoadingLocations ||
        isLoadingUsers ||
        isLoadingSubscriptions ||
        isLoadingFeedback ||
        isLoadingReviews ||
        isLoadingAIAgents ||
        isLoadingSystemLogs ||
        isLoadingChatMessages;

    // Combined error state
    const error =
        locationsError ||
        usersError ||
        subscriptionsError ||
        feedbackError ||
        reviewsError ||
        aiAgentsError ||
        systemLogsError ||
        chatMessagesError;

    // Refetch all data
    const refetchAll = () => {
        refetchLocations();
        refetchUsers();
        refetchSubscriptions();
        refetchFeedback();
        refetchReviews();
        refetchAIAgents();
        refetchSystemLogs();
        refetchChatMessages();
    };

    return {
        // Data
        locations,
        users,
        subscriptions,
        feedback,
        reviews,
        aiAgents,
        systemLogs,
        chatMessages,

        // Loading states
        isLoading,
        isLoadingLocations,
        isLoadingUsers,
        isLoadingSubscriptions,
        isLoadingFeedback,
        isLoadingReviews,
        isLoadingAIAgents,
        isLoadingSystemLogs,
        isLoadingChatMessages,

        // Errors
        error,
        locationsError,
        usersError,
        subscriptionsError,
        feedbackError,
        reviewsError,
        aiAgentsError,
        systemLogsError,
        chatMessagesError,

        // Refetch functions
        refetchAll,
        refetchLocations,
        refetchUsers,
        refetchSubscriptions,
        refetchFeedback,
        refetchReviews,
        refetchAIAgents,
        refetchSystemLogs,
        refetchChatMessages,
    };
}

export default useAdminData;
