import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Users, DollarSign } from "lucide-react";

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

    return (
        <Card className="bg-white dark:bg-neutral-800 border shadow-sm dark:border-neutral-700">
            <CardContent className="p-6">
                {/* Header */}
                <div className="mb-4">
                    <h3 className="font-semibold text-sm text-neutral-600 dark:text-neutral-400">
                        Users & Revenue
                    </h3>
                </div>

                {/* Total Users */}
                <div className="mb-4">
                    <div className="text-4xl font-bold text-neutral-900 dark:text-neutral-100">
                        {isLoading ? '...' : totalUsers.toLocaleString()}
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                        Total Users
                    </div>
                </div>

                {/* New Users (30d) */}
                <div className="mb-4">
                    <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                        New (30d)
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                            +{newUsers30d}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${isGrowthPositive
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                            {isGrowthPositive ? '+' : ''}{newUsersGrowth}%
                        </span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                    <div className="h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-500 dark:bg-blue-400 transition-all duration-500"
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 text-right">
                        {progressPercentage}%
                    </div>
                </div>

                {/* Monthly Revenue */}
                <div className="pt-3 border-t dark:border-neutral-700">
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                        MRR
                    </div>
                    <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                        ${isLoading ? '...' : monthlyRevenue.toLocaleString()}
                    </div>
                    <div className={`text-xs mt-1 ${revenueChange >= 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                        }`}>
                        {revenueChange >= 0 ? '+' : ''}${Math.abs(revenueChange)} vs last month
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
