import React from 'react';
import {
    LayoutDashboard,
    MapPin,
    Bot,
    Settings,
    Menu,
    X,
    LogOut,
    Plus
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AdminLayout({
    children,
    activeTab,
    onTabChange,
    user,
    onLogout,
    fabAction
}) {
    // Navigation Items
    const navItems = [
        { id: 'dashboard', label: 'Дашборд', icon: LayoutDashboard },
        { id: 'locations', label: 'Локации', icon: MapPin },
        { id: 'ai-management', label: 'AI Hub', icon: Bot },
        { id: 'settings', label: 'Меню', icon: Menu }, // Opens "More" menu on mobile
    ];

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex flex-col md:flex-row">

            {/* DESKTOP SIDEBAR (Hidden on Mobile) */}
            <aside className="hidden md:flex flex-col w-64 border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 sticky top-0 h-screen">
                <div className="p-6 border-b border-neutral-100 dark:border-neutral-800">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        GastroMap Admin
                    </h1>
                    <p className="text-xs text-neutral-500 mt-1">v2.1.0 • Enterprise</p>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {/* Main Tabs */}
                    <div className="mb-6">
                        <p className="px-3 text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                            Основное
                        </p>
                        {navItems.filter(i => i.id !== 'settings').map(item => (
                            <button
                                key={item.id}
                                onClick={() => onTabChange(item.id)}
                                className={cn(
                                    "w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                    activeTab === item.id
                                        ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                                        : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                                )}
                            >
                                <item.icon className="w-5 h-5" />
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Secondary Tabs (Desktop Only) */}
                    <div>
                        <p className="px-3 text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                            Управление
                        </p>
                        {[
                            { id: 'users', label: 'Пользователи' },
                            { id: 'reviews', label: 'Отзывы' },
                            { id: 'moderation', label: 'Модерация' },
                            { id: 'feedback', label: 'Обращения' },
                            { id: 'subscriptions', label: 'Подписки' },
                            { id: 'analytics', label: 'Аналитика' },
                            { id: 'system-logs', label: 'Логи' },
                            { id: 'media', label: 'Медиатека' },
                        ].map(item => (
                            <button
                                key={item.id}
                                onClick={() => onTabChange(item.id)}
                                className={cn(
                                    "w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors",
                                    activeTab === item.id
                                        ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100"
                                        : "text-neutral-500 hover:bg-neutral-50 dark:text-neutral-500 dark:hover:bg-neutral-900"
                                )}
                            >
                                <span className="w-5" /> {/* Indent */}
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </div>
                </nav>

                <div className="p-4 border-t border-neutral-100 dark:border-neutral-800">
                    <div className="flex items-center space-x-3 mb-4 px-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-xs">
                            {user?.email?.[0]?.toUpperCase() || 'A'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user?.email}</p>
                            <p className="text-xs text-neutral-500">Administrator</p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full text-red-500 hover:text-red-600 hover:bg-red-50" onClick={onLogout}>
                        <LogOut className="w-4 h-4 mr-2" />
                        Выйти
                    </Button>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 flex flex-col min-h-0 md:h-screen overflow-hidden">
                {/* Mobile Header */}
                <header className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-neutral-950 border-b sticky top-0 z-20">
                    <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        GastroMap
                    </h1>
                    <div className="flex items-center space-x-2">
                        {/* Placeholder for header actions if needed */}
                    </div>
                </header>

                {/* Content Scroller */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {children}
                    </div>
                </div>
            </main>

            {/* FLOATING ACTION BUTTON (FAB) - Visible on all devices */}
            {fabAction && (
                <div className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-30">
                    <Button
                        size="icon"
                        className="w-14 h-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={fabAction.onClick}
                    >
                        {fabAction.icon || <Plus className="w-6 h-6" />}
                    </Button>
                </div>
            )}

            {/* MOBILE BOTTOM NAVIGATION */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 pb-safe z-30">
                <div className="flex justify-around items-center h-16">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full space-y-1 active:scale-95 transition-transform",
                                activeTab === item.id
                                    ? "text-blue-600 dark:text-blue-400"
                                    : "text-neutral-400 dark:text-neutral-500"
                            )}
                        >
                            <item.icon className="w-6 h-6" strokeWidth={activeTab === item.id ? 2.5 : 2} />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </button>
                    ))}
                </div>
            </div>

        </div>
    );
}
