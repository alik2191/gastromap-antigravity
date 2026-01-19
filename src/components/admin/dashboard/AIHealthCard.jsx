import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, CheckCircle2, AlertCircle } from "lucide-react";

export default function AIHealthCard({
    status = 'healthy',
    scheduledTasks = 0,
    errorCount = 0,
    onSettingsClick,
    isLoading = false
}) {
    const isHealthy = status === 'healthy' || status === 'active';

    return (
        <Card className="bg-white dark:bg-neutral-800 border shadow-sm dark:border-neutral-700">
            <CardContent className="p-5">
                {/* Header */}
                <div className="mb-4">
                    <h3 className="font-semibold text-sm text-neutral-600 dark:text-neutral-400">
                        AI System
                    </h3>
                </div>

                {/* Status */}
                <div className="flex items-center gap-2 mb-4">
                    {isHealthy ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                    <span className={`font-semibold text-sm ${isHealthy
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                        {isLoading ? 'Loading...' : isHealthy ? 'Healthy' : 'Issues Detected'}
                    </span>
                </div>

                {/* Stats */}
                <div className="space-y-2 text-sm mb-4">
                    <div className="flex items-center justify-between">
                        <span className="text-neutral-600 dark:text-neutral-400">
                            Scheduled Tasks
                        </span>
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                            {scheduledTasks}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-neutral-600 dark:text-neutral-400">
                            Errors
                        </span>
                        <span className={`font-semibold ${errorCount > 0
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-neutral-900 dark:text-neutral-100'
                            }`}>
                            {errorCount}
                        </span>
                    </div>
                </div>

                {/* Settings Link */}
                <button
                    onClick={onSettingsClick}
                    className="text-xs text-emerald-600 dark:text-lime-400 hover:underline"
                    disabled={isLoading}
                >
                    → Settings
                </button>
            </CardContent>
        </Card>
    );
}
