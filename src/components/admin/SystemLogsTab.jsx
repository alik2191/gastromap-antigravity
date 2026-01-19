import React, { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { AlertCircle, Info, AlertTriangle, Bug, Search, RefreshCw, X, Terminal } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

const LogLevelBadge = ({ level }) => {
    switch (level) {
        case 'ERROR':
            return <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900"><AlertCircle className="w-3 h-3 mr-1" /> ERROR</Badge>;
        case 'WARN':
            return <Badge variant="warning" className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-900"><AlertTriangle className="w-3 h-3 mr-1" /> WARN</Badge>;
        case 'DEBUG':
            return <Badge variant="secondary" className="bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700"><Bug className="w-3 h-3 mr-1" /> DEBUG</Badge>;
        default:
            return <Badge variant="default" className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-900"><Info className="w-3 h-3 mr-1" /> INFO</Badge>;
    }
};

export default function SystemLogsTab() {
    const [page, setPage] = useState(0);
    const [levelFilter, setLevelFilter] = useState("ALL");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedLog, setSelectedLog] = useState(null);
    const [autoRefresh, setAutoRefresh] = useState(false);

    const { data: logs = [], isLoading, refetch } = useQuery({
        queryKey: ['system-logs', page, levelFilter],
        queryFn: async () => {
            // Build query
            // Note: SupabaseEntity.list() might need to be enhanced for complex filtering
            // For now, we fetch recent 100 and filter client-side if API doesn't support generic filtering yet
            // In a real scenario, we'd pass filters to the API.
            // Assuming .list support basic filtering or we use raw Supabase client if needed.
            // For this implementation, we'll fetch ordered list.

            // Note: Since 'list' in adapter is simple, we might need a direct call or specific method.
            // But let's assume standard list is usable and we sort by created_at desc
            const result = await api.entities.SystemLog.list('-created_at');
            return result;
        },
        refetchInterval: autoRefresh ? 5000 : false
    });

    // Filter Logic (Client-side for now, should be Server-side for production at scale)
    const filteredLogs = logs.filter(log => {
        if (levelFilter !== "ALL" && log.level !== levelFilter) return false;
        if (searchQuery && !log.message.toLowerCase().includes(searchQuery.toLowerCase()) && !log.component.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    const refreshLogs = () => {
        refetch();
    };

    return (
        <div className="space-y-4 h-full flex flex-col">
            {/* Header / Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <Input
                            placeholder="Поиск по логам..."
                            className="pl-9 bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Select value={levelFilter} onValueChange={setLevelFilter}>
                        <SelectTrigger className="w-[140px] bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700">
                            <SelectValue placeholder="Уровень" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Все уровни</SelectItem>
                            <SelectItem value="ERROR">Errors</SelectItem>
                            <SelectItem value="WARN">Warnings</SelectItem>
                            <SelectItem value="INFO">Info</SelectItem>
                            <SelectItem value="DEBUG">Debug</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto">
                    <Button
                        variant={autoRefresh ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        className={`gap-2 ${autoRefresh ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30' : ''}`}
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-spin' : ''}`} />
                        {autoRefresh ? 'Live' : 'Обновить'}
                    </Button>
                </div>
            </div>

            {/* Logs Table */}
            <Card className="flex-1 overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900">
                <div className="h-full overflow-auto">
                    <Table>
                        <TableHeader className="bg-neutral-50 dark:bg-neutral-950 sticky top-0 z-10">
                            <TableRow className="border-b border-neutral-200 dark:border-neutral-800">
                                <TableHead className="w-[180px]">Время</TableHead>
                                <TableHead className="w-[100px]">Уровень</TableHead>
                                <TableHead className="w-[150px]">Компонент</TableHead>
                                <TableHead>Сообщение</TableHead>
                                <TableHead className="w-[80px] text-right">Детали</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><div className="h-4 w-24 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" /></TableCell>
                                        <TableCell><div className="h-5 w-16 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" /></TableCell>
                                        <TableCell><div className="h-4 w-20 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" /></TableCell>
                                        <TableCell><div className="h-4 w-full bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" /></TableCell>
                                        <TableCell></TableCell>
                                    </TableRow>
                                ))
                            ) : filteredLogs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-[400px] text-center">
                                        <div className="flex flex-col items-center justify-center text-neutral-500">
                                            <Terminal className="w-12 h-12 mb-4 opacity-20" />
                                            <p className="font-medium">Логов не найдено</p>
                                            <p className="text-sm opacity-70">Система работает чисто (или логи еще не настроены)</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredLogs.map((log) => (
                                    <TableRow
                                        key={log.id}
                                        className="cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 border-b border-neutral-100 dark:border-neutral-800/50"
                                        onClick={() => setSelectedLog(log)}
                                    >
                                        <TableCell className="font-mono text-xs text-neutral-500">
                                            {format(new Date(log.created_at), 'dd.MM HH:mm:ss')}
                                        </TableCell>
                                        <TableCell>
                                            <LogLevelBadge level={log.level} />
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="font-mono text-[10px] uppercase dark:border-neutral-700">
                                                {log.component}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="max-w-[500px]">
                                            <div className="truncate text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                                {log.message}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-400">
                                                <Search className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {/* Log Details Sheet */}
            <Sheet open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
                <SheetContent className="w-[400px] sm:w-[540px] dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-800">
                    <SheetHeader className="mb-6">
                        <SheetTitle className="flex items-center gap-2 text-xl">
                            <Terminal className="w-5 h-5 text-neutral-500" />
                            Детали лога
                        </SheetTitle>
                        <SheetDescription>
                            ID: <span className="font-mono text-xs">{selectedLog?.id}</span>
                        </SheetDescription>
                    </SheetHeader>

                    {selectedLog && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <LogLevelBadge level={selectedLog.level} />
                                <span className="text-sm text-neutral-500 font-mono">
                                    {format(new Date(selectedLog.created_at), 'dd MMMM yyyy, HH:mm:ss.SSS', { locale: ru })}
                                </span>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Компонент</label>
                                <div className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                                    {selectedLog.component}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Сообщение</label>
                                <div className="p-4 rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-sm font-medium text-neutral-900 dark:text-neutral-200">
                                    {selectedLog.message}
                                </div>
                            </div>

                            {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Метаданные / Stack Trace</label>
                                    <div className="relative">
                                        <pre className="p-4 rounded-lg bg-neutral-900 text-neutral-50 text-xs font-mono overflow-auto max-h-[300px] border border-neutral-800">
                                            {JSON.stringify(selectedLog.metadata, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            )}

                            {selectedLog.user_id && (
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">User ID</label>
                                    <div className="flex items-center gap-2">
                                        <code className="text-xs bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded">
                                            {selectedLog.user_id}
                                        </code>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
