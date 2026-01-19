import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, TrendingUp, HardDrive } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-500 dark:text-lime-400" />
                    System
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {/* Top Location */}
                {topLocation ? (
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                            <TrendingUp className="w-3 h-3" />
                            <span>Top Location</span>
                        </div>
                        <div className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 truncate">
                            {isLoading ? 'Loading...' : topLocation}
                        </div>
                        <div className="text-xs text-neutral-600 dark:text-neutral-400">
                            {topLocationViews.toLocaleString()} views
                        </div>
                    </div>
                ) : (
                    <div className="text-sm text-neutral-500 dark:text-neutral-400">
                        No data available
                    </div>
                )}

                {/* Storage */}
                <div className="pt-2 border-t dark:border-neutral-700">
                    <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                        <HardDrive className="w-3 h-3" />
                        <span>Storage</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                            {storageUsed.toFixed(1)}GB / {storageTotal}GB
                        </div>
                        <Badge
                            variant={storagePercentage > 80 ? "destructive" : "outline"}
                            className={storagePercentage > 80
                                ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                                : "dark:border-neutral-600"
                            }
                        >
                            {storagePercentage}%
                        </Badge>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
