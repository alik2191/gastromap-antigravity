import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, CheckCircle2, Bot, Sparkles } from "lucide-react";

export default function AIAgentStatusCard({ agent, className, isLoading }) {
    if (isLoading) {
        return (
            <Card className={className}>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-neutral-500">
                        AI Status
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2 text-neutral-400">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-xs">Loading...</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Default fallback if no agent data
    if (!agent) {
        return (
            <Card className={className}>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
                        <Bot className="h-4 w-4" />
                        AI Guide
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Active
                            </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-neutral-500">
                            <Sparkles className="w-3 h-3" />
                            <span>gemini-2.0-flash</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const isHealthy = agent.status === 'active' || agent.status === 'idle';

    return (
        <Card className={className}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    {agent.name || 'AI Agent'}
                </CardTitle>
                <Bot className="h-4 w-4 text-neutral-500" />
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <Badge variant={isHealthy ? "default" : "destructive"} className={isHealthy ? "bg-green-100 text-green-700 hover:bg-green-200 border-green-200" : ""}>
                            {isHealthy ? (
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                            ) : (
                                <AlertCircle className="w-3 h-3 mr-1" />
                            )}
                            {agent.status || 'Unknown'}
                        </Badge>
                        <span className="text-xs text-neutral-500">
                            {agent.last_active ? new Date(agent.last_active).toLocaleTimeString() : 'Never'}
                        </span>
                    </div>
                    {agent.model && (
                        <div className="flex items-center gap-1 text-xs text-neutral-500">
                            <Sparkles className="w-3 h-3" />
                            <span>{agent.model}</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
