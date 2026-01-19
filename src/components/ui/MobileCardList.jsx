import React from 'react';
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MobileCardList({
    data = [],
    renderItem,
    isLoading = false,
    emptyMessage = "Нет данных",
    className
}) {
    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
            </div>
        );
    }

    if (!data.length) {
        return (
            <div className="text-center p-8 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl bg-neutral-50 dark:bg-neutral-900/50">
                <p className="text-neutral-500 text-sm">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className={cn("space-y-3 pb-20 md:pb-0", className)}>
            {data.map((item, index) => (
                <div key={item.id || index} className="animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${index * 50}ms` }}>
                    {renderItem(item)}
                </div>
            ))}
        </div>
    );
}
