import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Star, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function EngagementCard({
    newReviews = 0,
    newMessages = 0,
    averageRating = 0,
    isLoading = false
}) {
    return (
        <Card className="bg-white dark:bg-neutral-800 border shadow-sm dark:border-neutral-700">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-500 dark:text-lime-400" />
                    Engagement
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {/* New Reviews */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                        <FileText className="w-4 h-4" />
                        <span>Reviews</span>
                    </div>
                    <Badge
                        variant={newReviews > 0 ? "default" : "outline"}
                        className={newReviews > 0
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            : "dark:border-neutral-600"
                        }
                    >
                        {isLoading ? '...' : newReviews}
                    </Badge>
                </div>

                {/* New Messages */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                        <MessageSquare className="w-4 h-4" />
                        <span>Messages</span>
                    </div>
                    <Badge
                        variant={newMessages > 0 ? "default" : "outline"}
                        className={newMessages > 0
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                            : "dark:border-neutral-600"
                        }
                    >
                        {isLoading ? '...' : newMessages}
                    </Badge>
                </div>

                {/* Average Rating */}
                <div className="pt-2 border-t dark:border-neutral-700">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span>Avg Rating</span>
                        </div>
                        <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                            {isLoading ? '...' : averageRating.toFixed(1)}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
