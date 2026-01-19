import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Star, FileText } from "lucide-react";

export default function EngagementCard({
    newReviews = 0,
    newMessages = 0,
    averageRating = 0,
    isLoading = false
}) {
    return (
        <Card className="bg-white dark:bg-neutral-800 border shadow-sm dark:border-neutral-700">
            <CardContent className="p-5">
                {/* Header */}
                <div className="mb-4">
                    <h3 className="font-semibold text-sm text-neutral-600 dark:text-neutral-400">
                        Engagement
                    </h3>
                </div>

                {/* Stats */}
                <div className="space-y-3 text-sm">
                    {/* Reviews */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                            <FileText className="w-4 h-4" />
                            <span>Reviews</span>
                        </div>
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                            {isLoading ? '...' : newReviews}
                        </span>
                    </div>

                    {/* Messages */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                            <MessageSquare className="w-4 h-4" />
                            <span>Messages</span>
                        </div>
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                            {isLoading ? '...' : newMessages}
                        </span>
                    </div>

                    {/* Average Rating */}
                    <div className="flex items-center justify-between pt-2 border-t dark:border-neutral-700">
                        <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span>Avg Rating</span>
                        </div>
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                            {isLoading ? '...' : averageRating.toFixed(1)}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
