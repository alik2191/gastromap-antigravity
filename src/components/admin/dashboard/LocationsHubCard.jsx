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
        <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 border-0 shadow-lg shadow-blue-500/20 overflow-hidden relative">
            <CardContent className="p-6 text-white">
                {/* Circular Progress Indicator - Top Right */}
                <div className="absolute top-6 right-6">
                    <svg className="w-16 h-16 transform -rotate-90">
                        <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="transparent"
                            className="text-white/20"
                        />
                        <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="transparent"
                            strokeDasharray={175.93}
                            strokeDashoffset={175.93 - (175.93 * progressPercentage) / 100}
                            className="text-white transition-all duration-1000 ease-out"
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-bold text-white">{Math.round(progressPercentage)}%</span>
                    </div>
                </div>

                <div className="mb-8 relative z-10">
                    <h3 className="text-lg font-medium text-blue-100 mb-1">Locations Hub</h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-bold tracking-tight text-white">
                            {isLoading ? "..." : totalLocations}
                        </span>
                    </div>
                    <p className="text-blue-100 text-sm mt-2">Total Locations</p>

                    <div className="flex gap-4 mt-4 text-sm text-white/90">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)]" />
                            <span>{pendingLocations} Pending</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                            <span>{activeLocations} Active</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 mt-2 text-xs text-blue-200/80">
                        <Clock className="w-3 h-3" />
                        <span>Next AI Update: {nextAIUpdate || 'Not scheduled'}</span>
                    </div>
                </div>

                {/* Add Location Button */}
                <Button
                    onClick={onAddLocation}
                    className="w-full bg-white hover:bg-white/90 text-blue-600 font-semibold border-0"
                    disabled={isLoading}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Location
                </Button>
            </CardContent>
        </Card>
    );
}
