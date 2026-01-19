import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, HardDrive } from "lucide-react";

export default function SystemStatsCard({
    topLocation = null,
    topLocationViews = 0,
    storageUsed = 0,
    storageTotal = 10,
    isLoading = false
}) {
    const storagePercentage = storageTotal > 0
        ? Math.round((storageUsed / storageTotal) * 100)
        : 0;

    return (
        <Card className="bg-white dark:bg-neutral-800 border shadow-sm dark:border-neutral-700">
            <CardContent className="p-5">
                {/* Header */}
                <div className="mb-4">
                    <h3 className="font-semibold text-sm text-neutral-600 dark:text-neutral-400">
                        System
                    </h3>
                </div>

                {/* Top Location */}
                {topLocation ? (
                    <div className="mb-4">
                        <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                            <TrendingUp className="w-3 h-3" />
                            <span>Top Location</span>
                        </div>
                        <div className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 truncate">
                            {isLoading ? 'Loading...' : topLocation}
                        </div>
                        <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
                            {topLocationViews.toLocaleString()} views
                        </div>
                    </div>
                ) : (
                    <div className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                        No data
                    </div>
                )}

                {/* Storage */}
                <div className="pt-3 border-t dark:border-neutral-700">
                    <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                        <HardDrive className="w-3 h-3" />
                        <span>Storage</span>
                    </div>
                    <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        {storageUsed.toFixed(1)}GB / {storageTotal}GB
                    </div>
                    <div className={`text-xs mt-0.5 ${storagePercentage > 80
                            ? 'text-orange-600 dark:text-orange-400'
                            : 'text-neutral-600 dark:text-neutral-400'
                        }`}>
                        {storagePercentage}% used
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
