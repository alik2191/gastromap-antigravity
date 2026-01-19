import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, CheckCircle2, AlertCircle, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Sparkles className={`w-4 h-4 ${isHealthy
                            ? 'text-emerald-500 dark:text-lime-400'
                            : 'text-red-500 dark:text-red-400'
                        }`} />
                    AI System
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {/* Status */}
                <div className="flex items-center gap-2">
                    {isHealthy ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                    <span className={`font-semibold ${isHealthy
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                        {isLoading ? 'Loading...' : isHealthy ? 'Healthy' : 'Issues Detected'}
                    </span>
                </div>

                {/* Stats */}
                <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-neutral-600 dark:text-neutral-400">
                            Scheduled Tasks
                        </span>
                        <Badge variant="outline" className="dark:border-neutral-600">
                            {scheduledTasks}
                        </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-neutral-600 dark:text-neutral-400">
                            Errors
                        </span>
                        <Badge
                            variant={errorCount > 0 ? "destructive" : "outline"}
                            className={errorCount > 0
                                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                : "dark:border-neutral-600"
                            }
                        >
                            {errorCount}
                        </Badge>
                    </div>
                </div>

                {/* Settings Button */}
                <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={onSettingsClick}
                    disabled={isLoading}
                >
                    <Settings className="w-3 h-3 mr-2" />
                    Settings
                </Button>
            </CardContent>
        </Card>
    );
}
