import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, Users, MapPin, Eye, ArrowUpRight, ArrowDownRight, Calendar } from "lucide-react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { startOfMonth, subMonths, format, parseISO, eachDayOfInterval, subDays } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function AnalyticsTab() {
    // Fetch data
    const { data: users = [], isLoading: loadingUsers } = useQuery({
        queryKey: ['analytics-users'],
        queryFn: () => api.entities.User.list(),
        staleTime: 5 * 60 * 1000 // 5 min cache
    });

    const { data: locations = [], isLoading: loadingLocations } = useQuery({
        queryKey: ['analytics-locations'],
        queryFn: () => api.entities.Location.list(),
        staleTime: 5 * 60 * 1000
    });

    // Process Data for Charts
    const chartData = useMemo(() => {
        if (loadingUsers || loadingLocations) return null;

        // 1. User Growth (Last 6 months)
        const months = Array.from({ length: 6 }).map((_, i) => {
            const date = subMonths(new Date(), 5 - i);
            return {
                name: format(date, 'MMM', { locale: ru }),
                monthStart: startOfMonth(date),
                users: 0,
                revenue: 0 // Mock
            };
        });

        // Distribute users into months
        users.forEach(user => {
            const createdAt = new Date(user.created_at);
            const monthIndex = months.findIndex(m =>
                createdAt.getMonth() === m.monthStart.getMonth() &&
                createdAt.getFullYear() === m.monthStart.getFullYear()
            );
            if (monthIndex !== -1) {
                // Accumulate (cumulative growth would require running total, but this shows new users per month)
                months[monthIndex].users += 1;
            }
        });

        // Cumulative transformation
        let runningTotal = 0;
        const userGrowthData = months.map(m => {
            runningTotal += m.users;
            return { ...m, totalUsers: runningTotal, newUsers: m.users };
        });


        // 2. Locations Status Pie
        const locationStats = [
            { name: 'Активные', value: locations.filter(l => l.status === 'active').length, color: '#22c55e' },
            { name: 'На модерации', value: locations.filter(l => l.status === 'pending').length, color: '#eab308' },
            { name: 'Черновики', value: locations.filter(l => l.status === 'draft').length, color: '#94a3b8' },
            { name: 'Отклоненные', value: locations.filter(l => l.status === 'rejected').length, color: '#ef4444' },
        ].filter(item => item.value > 0);


        // 3. Views Activity (Mock based on random + real count)
        // Since we don't have historical view logs, we generate a trend based on total views distributed randomly over last 30 days
        const last30Days = eachDayOfInterval({
            start: subDays(new Date(), 29),
            end: new Date()
        });

        const totalViews = locations.reduce((acc, loc) => acc + (loc.views || 0), 0);

        // Mock daily distribution
        const activityData = last30Days.map(date => ({
            date: format(date, 'dd.MM'),
            views: Math.floor(Math.random() * (totalViews / 10)) + 50, // Mock noise
            likes: Math.floor(Math.random() * 20) + 5
        }));

        return {
            userGrowth: userGrowthData,
            locationStats,
            activityData,
            totalViews
        };
    }, [users, locations, loadingUsers, loadingLocations]);

    const isLoading = loadingUsers || loadingLocations;

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
                    <CardContent className="p-4 md:p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs md:text-sm text-neutral-500 font-medium">Всего пользователей</p>
                                <h3 className="text-xl md:text-2xl font-bold mt-1 text-neutral-900 dark:text-neutral-100">{users.length}</h3>
                            </div>
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                                <Users className="w-4 h-4 md:w-5 md:h-5" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-xs text-green-600 dark:text-green-400">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            <span className="font-medium">+12%</span>
                            <span className="text-neutral-400 ml-1">от прошлого месяца</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
                    <CardContent className="p-4 md:p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs md:text-sm text-neutral-500 font-medium">Активных локаций</p>
                                <h3 className="text-xl md:text-2xl font-bold mt-1 text-neutral-900 dark:text-neutral-100">
                                    {locations.filter(l => l.status === 'active').length}
                                </h3>
                            </div>
                            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-600 dark:text-green-400">
                                <MapPin className="w-4 h-4 md:w-5 md:h-5" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-xs text-neutral-500">
                            <span>Всего: {locations.length} локаций</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
                    <CardContent className="p-4 md:p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs md:text-sm text-neutral-500 font-medium">Просмотры</p>
                                <h3 className="text-xl md:text-2xl font-bold mt-1 text-neutral-900 dark:text-neutral-100">
                                    {chartData.totalViews > 1000 ? `${(chartData.totalViews / 1000).toFixed(1)}k` : chartData.totalViews}
                                </h3>
                            </div>
                            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600 dark:text-purple-400">
                                <Eye className="w-4 h-4 md:w-5 md:h-5" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-xs text-green-600 dark:text-green-400">
                            <ArrowUpRight className="w-3 h-3 mr-1" />
                            <span className="font-medium">+24%</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
                    <CardContent className="p-4 md:p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs md:text-sm text-neutral-500 font-medium">Конверсия (Demo)</p>
                                <h3 className="text-xl md:text-2xl font-bold mt-1 text-neutral-900 dark:text-neutral-100">3.2%</h3>
                            </div>
                            <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-orange-600 dark:text-orange-400">
                                <TrendingUp className="w-4 h-4 md:w-5 md:h-5" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-xs text-red-500">
                            <ArrowDownRight className="w-3 h-3 mr-1" />
                            <span className="font-medium">-0.4%</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Graph */}
                <Card className="col-span-1 lg:col-span-2 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
                    <CardHeader>
                        <CardTitle className="dark:text-neutral-100">Рост аудитории</CardTitle>
                        <CardDescription>Динамика новых пользователей за 6 месяцев</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData.userGrowth}>
                                    <defs>
                                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" className="dark:stroke-neutral-800" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: '#737373' }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: '#737373' }}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="totalUsers"
                                        name="Всего пользователей"
                                        stroke="#3b82f6"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorUsers)"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="newUsers"
                                        name="Новые"
                                        stroke="#60a5fa"
                                        strokeDasharray="5 5"
                                        fill="none"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Pie Chart */}
                <Card className="col-span-1 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
                    <CardHeader>
                        <CardTitle className="dark:text-neutral-100">Статус локаций</CardTitle>
                        <CardDescription>Распределение по статусам</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full flex flex-col items-center justify-center">
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie
                                        data={chartData.locationStats}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {chartData.locationStats.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex flex-wrap gap-4 justify-center mt-4">
                                {chartData.locationStats.map((entry, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                                        <span className="text-xs text-neutral-600 dark:text-neutral-400">
                                            {entry.name} ({entry.value})
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Views Line Chart */}
            <Card className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
                <CardHeader>
                    <CardTitle className="dark:text-neutral-100">Активность просмотров</CardTitle>
                    <CardDescription>Просмотры карточек локаций за 30 дней</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData.activityData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" className="dark:stroke-neutral-800" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fill: '#737373' }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fill: '#737373' }}
                                />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                <Line
                                    type="monotone"
                                    dataKey="views"
                                    stroke="#8b5cf6"
                                    strokeWidth={3}
                                    dot={false}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}