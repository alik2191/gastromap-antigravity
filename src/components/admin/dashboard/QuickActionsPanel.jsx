import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Mail,
    Search,
    CreditCard,
    BarChart3,
    Settings,
    ArrowRight
} from "lucide-react";

export default function QuickActionsPanel({
    onInviteUser,
    onReviewLocations,
    onManageSubscriptions,
    onViewAnalytics,
    onOpenSettings,
    pendingLocationsCount = 0,
    isLoading = false
}) {
    const actions = [
        {
            icon: Mail,
            label: 'Invite User',
            onClick: onInviteUser,
            variant: 'default',
            className: 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white'
        },
        {
            icon: Search,
            label: 'Review Locations',
            onClick: onReviewLocations,
            variant: 'outline',
            badge: pendingLocationsCount > 0 ? pendingLocationsCount : null
        },
        {
            icon: CreditCard,
            label: 'Manage Subscriptions',
            onClick: onManageSubscriptions,
            variant: 'outline'
        },
        {
            icon: BarChart3,
            label: 'Analytics',
            onClick: onViewAnalytics,
            variant: 'outline'
        },
        {
            icon: Settings,
            label: 'Settings',
            onClick: onOpenSettings,
            variant: 'outline'
        }
    ];

    return (
        <Card className="bg-white dark:bg-neutral-800 border shadow-sm dark:border-neutral-700">
            <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <ArrowRight className="w-5 h-5 text-emerald-500 dark:text-lime-400" />
                    Quick Actions
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {actions.map((action, index) => {
                        const Icon = action.icon;
                        return (
                            <Button
                                key={index}
                                variant={action.variant}
                                onClick={action.onClick}
                                disabled={isLoading}
                                className={`flex flex-col items-center justify-center h-20 gap-2 relative ${action.className || ''}`}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="text-xs font-medium text-center leading-tight">
                                    {action.label}
                                </span>
                                {action.badge && (
                                    <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                        {action.badge}
                                    </span>
                                )}
                            </Button>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
