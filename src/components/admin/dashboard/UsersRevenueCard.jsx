import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export default function UsersRevenueCard({
    totalUsers = 0,
    newUsers30d = 0,
    newUsersGrowth = 0,
    monthlyRevenue = 0,
    revenueChange = 0,
    isLoading = false
}) {
    const progressPercentage = Math.min(Math.abs(newUsersGrowth), 100);
    const isGrowthPositive = newUsersGrowth >= 0;
    const isRevenuePositive = revenueChange >= 0;

    return (
        <Card className="bg-white dark:bg-neutral-800 border shadow-sm dark:border-neutral-700">
            <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-500 dark:text-lime-400" />
                    Users & Revenue
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Total Users */}
                <div>
                    <div className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                        {isLoading ? '...' : totalUsers.toLocaleString()}
                    </div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-400">
                        Total Users
                    </div>
                </div>

                {/* New Users (30d) */}
                <div className="flex items-center justify-between">
                    <div className="text-sm text-neutral-600 dark:text-neutral-400">
                        New (30d)
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                            +{newUsers30d}
                        </span>
                        <Badge
                            variant={isGrowthPositive ? "default" : "destructive"}
                            className={isGrowthPositive
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            }
                        >
                            {isGrowthPositive ? (
                                <TrendingUp className="w-3 h-3 mr-1" />
                            ) : (
                                <TrendingDown className="w-3 h-3 mr-1" />
                            )}
                            {Math.abs(newUsersGrowth)}%
                        </Badge>
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t dark:border-neutral-700"></div>

                {/* Monthly Revenue */}
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                        <span className="text-sm text-neutral-600 dark:text-neutral-400">
                            MRR
                        </span>
                    </div>
                    <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                        ${isLoading ? '...' : monthlyRevenue.toLocaleString()}
                    </div>
                    <div className={`text-xs mt-1 ${isRevenuePositive
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                        {isRevenuePositive ? '+' : ''}${Math.abs(revenueChange)} vs last month
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                    <Progress
                        value={progressPercentage}
                        className="h-2 bg-neutral-200 dark:bg-neutral-700"
                        indicatorClassName="bg-emerald-500 dark:bg-lime-400"
                    />
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 text-right">
                        Growth: {progressPercentage}%
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
