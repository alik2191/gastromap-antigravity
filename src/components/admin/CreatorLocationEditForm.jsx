import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api } from '@/api/client';
import LocationForm from './LocationForm';
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function CreatorLocationEditForm({ isOpen, onOpenChange, locationId, user, onSuccess }) {
    const queryClient = useQueryClient();

    const { data: location, isLoading: isLoadingLocation } = useQuery({
        queryKey: ['location', locationId],
        queryFn: async () => {
            if (!locationId) return null;
            // Depending on API, get specific location. 
            // Assuming api.entities.Location.get exists or list and find.
            // Usually list? Let's assume list for now or if get is available.
            // Looking at Admin.jsx logic, it uses list.
            // But let's try a direct get if the adapter supports it, otherwise list with filter. 
            // Previous code used list. 
            // Safer to use list and find for now if unsure about 'get' implementation, 
            // but let's check Admin.jsx usage of api.entities.Location.
            // Admin.jsx uses api.entities.Location.delete(id) and update(id, data).
            // It uses api.entities.Location.list().

            // Let's optimize: fetch list is cached.
            // Ideally we should have a get method.
            // If not, we can assume the parent passed the full location object?
            // No, the parent passed locationId.

            // Let's assume we can fetch it.
            try {
                // Try to get from cache first?
                const cache = queryClient.getQueryData(['admin-locations']);
                if (cache) {
                    const found = cache.find(l => l.id === locationId);
                    if (found) return found;
                }
                // If not in cache or if we want fresh data
                const all = await api.entities.Location.list();
                return all.find(l => l.id === locationId);
            } catch (e) {
                console.error("Failed to fetch location", e);
                return null;
            }
        },
        enabled: !!locationId && isOpen
    });

    const mutation = useMutation({
        mutationFn: (data) => api.entities.Location.update(locationId, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-locations']);
            queryClient.invalidateQueries(['admin-pending-locations']);
            queryClient.invalidateQueries(['location', locationId]);
            toast.success('Локация успешно обновлена');
            onSuccess?.();
            onOpenChange(false);
        },
        onError: (error) => {
            toast.error('Ошибка обновления: ' + error.message);
        }
    });

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto dark:bg-neutral-800 dark:border-neutral-700">
                <DialogHeader>
                    <DialogTitle className="text-neutral-900 dark:text-neutral-100">
                        Редактирование локации
                    </DialogTitle>
                </DialogHeader>
                {isLoadingLocation && !location ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
                    </div>
                ) : (
                    <LocationForm
                        location={location}
                        onSubmit={(data) => mutation.mutate(data)}
                        isLoading={mutation.isPending}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}
