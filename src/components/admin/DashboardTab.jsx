import React, { useMemo } from 'react';
import { api } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Users, DollarSign, MapPin, Activity, TrendingUp, AlertCircle,
    ArrowUpRight, ArrowDownRight, UserPlus, CreditCard
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { format, subDays, startOfDay, isSameDay } from "date-fns";
import { ru } from "date-fns/locale";

export default function DashboardTab() {
    // 1. Fetch Users
    const { data: users = [], isLoading: loadingUsers } = useQuery({
        queryKey: ['admin-dashboard-users'],
        queryFn: () => api.entities.User.list()
    });

    // 2. Fetch Locations
    const { data: locations = [], isLoading: loadingLocations } = useQuery({
        queryKey: ['admin-dashboard-locations'],
        queryFn: () => api.entities.Location.list()
    });

    // 3. Fetch Subscriptions (Revenue Proxy)
    const { data: subscriptions = [], isLoading: loadingSubs } = useQuery({
        queryKey: ['admin-dashboard-subs'],
        queryFn: () => api.entities.Subscription.list()
    });

    // 4. Fetch Recent Errors (System Pulse)
    const { data: recentLogs = [], isLoading: loadingLogs } = useQuery({
        queryKey: ['admin-dashboard-errors'],
        queryFn: () => api.entities.SystemLog.list() // assuming list returns generic
    });

    // --- Metrics Calculation ---

    const stats = useMemo(() => {
        // Users
        const totalUsers = users.length;
        const newUsersToday = users.filter(u => isSameDay(new Date(u.created_at), new Date())).length;
        const activeUsersComp = 120; // Mock comparison for now

        // Revenue (Mock calculation based on sub plan)
        const activeSubs = subscriptions.filter(s => s.status === 'active');
        const estRevenue = activeSubs.reduce((sum, sub) => sum + (sub.plan === 'pro' ? 19 : 9), 0); // Mock pricing

        // Locations
        const totalLocations = locations.length;
        const pendingLocations = locations.filter(l => l.status === 'pending').length;

        // Errors (Last 24h)
        const errors24h = recentLogs.filter(l =>
            l.level === 'ERROR' &&
            new Date(l.created_at) > subDays(new Date(), 1)
        ).length;

        return {
            totalUsers,
            newUsersToday,
            activeSubs: activeSubs.length,
            estRevenue,
            totalLocations,
            pendingLocations,
            errors24h
        };
    }, [users, locations, subscriptions, recentLogs]);

    // --- Chart Data (User Growth - Last 14 days) ---
    const chartData = useMemo(() => {
        const days = Array.from({ length: 14 }).map((_, i) => {
            const date = subDays(new Date(), 13 - i);
            return {
                date: format(date, 'MMM dd', { locale: ru }),
                fullDate: date,
                users: 0
            };
        });

        users.forEach(user => {
            const userDate = startOfDay(new Date(user.created_at));
            const dayStat = days.find(d => isSameDay(d.fullDate, userDate));
            if (dayStat) {
                dayStat.users += 1;
            }
        });

        // Cumulative or Daily? Let's do Daily for activity
        return days;
    }, [users]);


    return (
        <div className="space-y-6">
            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-0 shadow-sm bg-white dark:bg-neutral-900 ring-1 ring-neutral-200 dark:ring-neutral-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Всего пользователей</CardTitle>
                        <Users className="h-4 w-4 text-neutral-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{stats.totalUsers}</div>
                        <p className="text-xs text-neutral-500 mt-1 flex items-center">
                            {stats.newUsersToday > 0 ? (
                                <span className="text-green-600 flex items-center font-medium">
                                    <TrendingUp className="w-3 h-3 mr-1" />
                                    +{stats.newUsersToday} сегодня
                                </span>
                            ) : (
                                <span className="text-neutral-400">Нет регистраций сегодня</span>
                            )}
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white dark:bg-neutral-900 ring-1 ring-neutral-200 dark:ring-neutral-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Доход (est.)</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">${stats.estRevenue}</div>
                        <p className="text-xs text-neutral-500 mt-1">
                            {stats.activeSubs} активных подписок
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white dark:bg-neutral-900 ring-1 ring-neutral-200 dark:ring-neutral-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Локации</CardTitle>
                        <MapPin className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{stats.totalLocations}</div>
                        <p className="text-xs text-neutral-500 mt-1 flex items-center gap-2">
                            {stats.pendingLocations > 0 && (
                                <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200 h-5 px-1.5 font-normal">
                                    {stats.pendingLocations} на модерации
                                </Badge>
                            )}
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white dark:bg-neutral-900 ring-1 ring-neutral-200 dark:ring-neutral-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Здоровье системы</CardTitle>
                        <Activity className={`h-4 w-4 ${stats.errors24h > 0 ? 'text-red-500' : 'text-green-500'}`} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                            {stats.errors24h > 0 ? (
                                <span className="text-red-600">{stats.errors24h} ошибок</span>
                            ) : (
                                <span className="text-green-600">Отлично</span>
                            )}
                        </div>
                        <p className="text-xs text-neutral-500 mt-1">
                            за последние 24 часа
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Main User Growth Chart */}
                <Card className="col-span-2 border-0 shadow-sm bg-white dark:bg-neutral-900 ring-1 ring-neutral-200 dark:ring-neutral-800">
                    <CardHeader>
                        <CardTitle>Активность регистраций</CardTitle>
                        <CardDescription>Новые пользователи за последние 2 недели</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-0">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis
                                        dataKey="date"
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `${value}`}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="users"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorUsers)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Info / Quick Actions */}
                <Card className="col-span-1 border-0 shadow-sm bg-white dark:bg-neutral-900 ring-1 ring-neutral-200 dark:ring-neutral-800">
                    <CardHeader>
                        <CardTitle>Быстрые действия</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button className="w-full justify-start" variant="outline">
                            <UserPlus className="mr-2 h-4 w-4" />
                            Пригласить создателя
                        </Button>
                        <Button className="w-full justify-start" variant="outline">
                            <MapPin className="mr-2 h-4 w-4" />
                            Проверить новые локации
                            {stats.pendingLocations > 0 && <Badge className="ml-auto bg-amber-500 hover:bg-amber-600">{stats.pendingLocations}</Badge>}
                        </Button>
                        <Button className="w-full justify-start" variant="outline">
                            <CreditCard className="mr-2 h-4 w-4" />
                            Управление тарифами
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
