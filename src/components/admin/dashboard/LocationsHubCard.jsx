import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Clock } from "lucide-react";

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
        <Card className="bg-neutral-100 dark:bg-neutral-800 border shadow-sm dark:border-neutral-700 overflow-hidden relative">
            <CardContent className="p-6 text-neutral-900 dark:text-neutral-100">
                {/* Circular Progress Indicator - Top Right */}
                <div className="absolute top-6 right-6">
                    <svg className="w-16 h-16 transform -rotate-90">
                        <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                            className="opacity-20"
                        />
                        <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                            strokeDasharray={`${2 * Math.PI * 28}`}
                            strokeDashoffset={`${2 * Math.PI * 28 * (1 - progressPercentage / 100)}`}
                            className="transition-all duration-500"
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-bold">{progressPercentage}%</span>
                    </div>
                </div>

                {/* Header */}
                <div className="mb-3">
                    <h3 className="font-semibold text-base opacity-90">Locations Hub</h3>
                </div>

                {/* Main Metric */}
                <div className="mb-4">
                    <div className="text-6xl font-bold mb-1">
                        {isLoading ? '...' : totalLocations}
                    </div>
                    <div className="text-sm opacity-75">Total Locations</div>
                </div>

                {/* Status Row */}
                <div className="flex items-center gap-3 mb-3 text-sm opacity-90">
                    <div>🟡 {pendingLocations} Pending</div>
                    <div>🟢 {activeLocations} Active</div>
                </div>

                {/* AI Update Schedule */}
                {nextAIUpdate && (
                    <div className="flex items-center gap-2 mb-4 text-sm opacity-75">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Next AI Update: {nextAIUpdate}</span>
                    </div>
                )}

                {/* Add Location Button */}
                <Button
                    onClick={onAddLocation}
                    className="w-full bg-emerald-500 dark:bg-emerald-600 hover:bg-emerald-600 dark:hover:bg-emerald-700 text-white border-0"
                    disabled={isLoading}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Location
                </Button>
            </CardContent>
        </Card>
    );
}
