import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adapter } from '@/api/supabaseAdapter';
import { toast } from 'sonner';
import { handleError } from '@/lib/errorHandler';

/**
 * Custom hook for admin mutations
 * Centralizes all mutation logic from Admin.jsx
 */
export function useAdminMutations() {
    const queryClient = useQueryClient();

    // Location mutations
    const createLocation = useMutation({
        mutationFn: (data) => adapter.entities.Location.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries(['locations']);
            toast.success('Локация успешно создана');
        },
        onError: (error) => handleError(error, { context: 'Создание локации' }),
    });

    const updateLocation = useMutation({
        mutationFn: ({ id, data }) => adapter.entities.Location.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['locations']);
            toast.success('Локация успешно обновлена');
        },
        onError: (error) => handleError(error, { context: 'Обновление локации' }),
    });

    const deleteLocation = useMutation({
        mutationFn: (id) => adapter.entities.Location.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries(['locations']);
            toast.success('Локация успешно удалена');
        },
        onError: (error) => handleError(error, { context: 'Удаление локации' }),
    });

    // User mutations
    const updateUser = useMutation({
        mutationFn: ({ id, data }) => adapter.entities.User.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['users']);
            toast.success('Пользователь успешно обновлен');
        },
        onError: (error) => handleError(error, { context: 'Обновление пользователя' }),
    });

    const deleteUser = useMutation({
        mutationFn: (id) => adapter.entities.User.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries(['users']);
            toast.success('Пользователь успешно удален');
        },
        onError: (error) => handleError(error, { context: 'Удаление пользователя' }),
    });

    // Subscription mutations
    const createSubscription = useMutation({
        mutationFn: (data) => adapter.entities.Subscription.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries(['subscriptions']);
            toast.success('Подписка успешно создана');
        },
        onError: (error) => handleError(error, { context: 'Создание подписки' }),
    });

    const updateSubscription = useMutation({
        mutationFn: ({ id, data }) => adapter.entities.Subscription.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['subscriptions']);
            toast.success('Подписка успешно обновлена');
        },
        onError: (error) => handleError(error, { context: 'Обновление подписки' }),
    });

    const deleteSubscription = useMutation({
        mutationFn: (id) => adapter.entities.Subscription.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries(['subscriptions']);
            toast.success('Подписка успешно удалена');
        },
        onError: (error) => handleError(error, { context: 'Удаление подписки' }),
    });

    // Feedback mutations
    const updateFeedbackStatus = useMutation({
        mutationFn: ({ id, status }) => adapter.entities.Feedback.update(id, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries(['feedback']);
            toast.success('Статус отзыва обновлен');
        },
        onError: (error) => handleError(error, { context: 'Обновление статуса отзыва' }),
    });

    const deleteFeedback = useMutation({
        mutationFn: (id) => adapter.entities.Feedback.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries(['feedback']);
            toast.success('Отзыв успешно удален');
        },
        onError: (error) => handleError(error, { context: 'Удаление отзыва' }),
    });

    // Review mutations
    const updateReviewStatus = useMutation({
        mutationFn: ({ id, status }) => adapter.entities.Review.update(id, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries(['reviews']);
            toast.success('Статус отзыва обновлен');
        },
        onError: (error) => handleError(error, { context: 'Обновление статуса отзыва' }),
    });

    const deleteReview = useMutation({
        mutationFn: (id) => adapter.entities.Review.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries(['reviews']);
            toast.success('Отзыв успешно удален');
        },
        onError: (error) => handleError(error, { context: 'Удаление отзыва' }),
    });

    // AI Agent mutations
    const updateAIAgent = useMutation({
        mutationFn: ({ id, data }) => adapter.entities.AIAgent.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['aiAgents']);
            toast.success('AI агент успешно обновлен');
        },
        onError: (error) => handleError(error, { context: 'Обновление AI агента' }),
    });

    return {
        // Location mutations
        createLocation,
        updateLocation,
        deleteLocation,

        // User mutations
        updateUser,
        deleteUser,

        // Subscription mutations
        createSubscription,
        updateSubscription,
        deleteSubscription,

        // Feedback mutations
        updateFeedbackStatus,
        deleteFeedback,

        // Review mutations
        updateReviewStatus,
        deleteReview,

        // AI Agent mutations
        updateAIAgent,
    };
}

export default useAdminMutations;
