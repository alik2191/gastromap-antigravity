import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Plus, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function LocationsHubCard({
    totalLocations = 0,
    pendingLocations = 0,
    activeLocations = 0,
    nextAIUpdate = null,
    onAddLocation,
    isLoading = false
}) {
    const progressPercentage = totalLocations > 0
        ? Math.round((activeLocations / totalLocations) * 100)
        : 0;

    return (
        <Card className="bg-emerald-500 dark:bg-lime-400 border-0 shadow-lg overflow-hidden">
            <CardContent className="p-6 text-white dark:text-black">
                {/* Header */}
                <div className="flex items-center gap-2 mb-4">
                    <MapPin className="w-5 h-5" />
                    <h3 className="font-semibold text-lg">Locations Hub</h3>
                </div>

                {/* Main Metric */}
                <div className="mb-4">
                    <div className="text-5xl font-bold mb-2">
                        {isLoading ? '...' : totalLocations}
                    </div>
                    <div className="text-sm opacity-90">Total Locations</div>
                </div>

                {/* Status Row */}
                <div className="flex items-center gap-4 mb-4 text-sm">
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-yellow-400 dark:bg-yellow-600"></span>
                        <span className="opacity-90">{pendingLocations} Pending</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-white dark:bg-black"></span>
                        <span className="opacity-90">{activeLocations} Active</span>
                    </div>
                </div>

                {/* AI Update Schedule */}
                {nextAIUpdate && (
                    <div className="flex items-center gap-2 mb-4 text-sm opacity-90">
                        <Clock className="w-4 h-4" />
                        <span>Next AI Update: {nextAIUpdate}</span>
                    </div>
                )}

                {/* Add Location Button */}
                <Button
                    onClick={onAddLocation}
                    className="w-full bg-white/20 dark:bg-black/20 hover:bg-white/30 dark:hover:bg-black/30 text-white dark:text-black border-0 mb-4"
                    disabled={isLoading}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Location
                </Button>

                {/* Progress Bar */}
                <div className="space-y-2">
                    <Progress
                        value={progressPercentage}
                        className="h-2 bg-white/20 dark:bg-black/20"
                        indicatorClassName="bg-white dark:bg-black"
                    />
                    <div className="text-xs opacity-90 text-right">
                        {progressPercentage}% Active
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
