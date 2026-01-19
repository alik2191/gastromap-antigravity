import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Bot, Sparkles, MessageSquare, Play, Clock, CheckCircle, AlertCircle, Loader2, Filter, ChevronDown, ChevronUp, Save } from "lucide-react";
import { toast } from "sonner";
import { api } from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AITestPlayground from './AITestPlayground';

export default function AIManagementTab() {
    const [runningCheck, setRunningCheck] = useState(false);
    const [showCheckDialog, setShowCheckDialog] = useState(false);
    const [checkCountry, setCheckCountry] = useState('all');
    const [checkCity, setCheckCity] = useState('all');
    const [showAllHistory, setShowAllHistory] = useState(false);
    const [processingRoundId, setProcessingRoundId] = useState(null);
    const [promptEdits, setPromptEdits] = useState({});
    const [savingPrompt, setSavingPrompt] = useState(null);

    // Admin Agent Chat State
    const [adminChatMessages, setAdminChatMessages] = useState([]);
    const [adminChatInput, setAdminChatInput] = useState('');
    const [adminChatLoading, setAdminChatLoading] = useState(false);

    const queryClient = useQueryClient();

    // Get unique countries and cities for filters
    const { data: allLocations = [] } = useQuery({
        queryKey: ['all-locations-for-filters'],
        queryFn: () => api.entities.Location.list()
    });

    const countries = [...new Set(allLocations.map(l => l.country).filter(Boolean))].sort();
    const cities = checkCountry && checkCountry !== 'all'
        ? [...new Set(allLocations.filter(l => l.country === checkCountry).map(l => l.city).filter(Boolean))].sort()
        : [];

    // Fetch check history
    const { data: checkHistory = [], isLoading: loadingHistory } = useQuery({
        queryKey: ['moderation-check-history'],
        queryFn: async () => {
            const history = await api.entities.ModerationCheckHistory.list('-check_date', 10);
            return history;
        }
    });

    // Fetch AI Agents
    const { data: aiAgents = [], refetch: refetchAgents } = useQuery({
        queryKey: ['ai-agents'],
        queryFn: async () => {
            return await api.entities.AIAgent.list();
        }
    });

    // Initialize prompt edits when data loads
    useEffect(() => {
        if (aiAgents.length > 0) {
            const edits = {};
            aiAgents.forEach(agent => {
                edits[agent.key] = agent.system_prompt;
            });
            setPromptEdits(edits);
        }
    }, [aiAgents]);

    // Save prompt mutation
    const savePromptMutation = useMutation({
        mutationFn: async ({ agentKey, systemPrompt, description }) => {
            const existing = aiAgents.find(a => a.key === agentKey);
            if (existing) {
                return api.entities.AIAgent.update(existing.id, { system_prompt: systemPrompt });
            } else {
                // If agent doesn't exist, we can't create it easily without name/role
                // But since we seeded them, this shouldn't happen.
                // Fallback to error or simple creation if allowed
                throw new Error(`Agent ${agentKey} not found. Please run migration.`);
            }
        },
        onSuccess: () => {
            refetchAgents();
            toast.success('Промпт сохранён');
            setSavingPrompt(null);
        },
        onError: (error) => {
            toast.error('Ошибка сохранения: ' + error.message);
            setSavingPrompt(null);
        }
    });

    const handleSavePrompt = (agentKey, description) => {
        setSavingPrompt(agentKey);
        savePromptMutation.mutate({
            agentKey,
            systemPrompt: promptEdits[agentKey] || '',
            description
        });
    };

    const getPromptValue = (key, defaultValue) => {
        if (promptEdits[key] !== undefined) return promptEdits[key];
        const existing = aiAgents.find(a => a.key === key);
        return existing?.system_prompt || defaultValue;
    };

    // Fetch AI-generated moderation rounds with location data
    const { data: moderationRounds = [], isLoading: loadingRounds, refetch: refetchRounds } = useQuery({
        queryKey: ['moderationRounds', 'pending_admin_review'],
        queryFn: async () => {
            const allRounds = await api.entities.ModerationRound.filter({
                status: 'pending_admin_review'
            });

            // Filter only AI-generated rounds (exclude creator moderation rounds)
            // AI rounds have yes_count === 0 and no_count === 0 (never voted by creators)
            const aiRounds = allRounds.filter(round =>
                (round.yes_count === 0 || !round.yes_count) &&
                (round.no_count === 0 || !round.no_count)
            );

            // Fetch location data for each round to show current values
            const roundsWithLocations = await Promise.all(
                aiRounds.map(async (round) => {
                    const locations = await api.entities.Location.filter({ id: round.location_id });
                    return {
                        ...round,
                        currentValue: locations[0]?.[round.field_name] || null
                    };
                })
            );

            return roundsWithLocations;
        },
        refetchInterval: 10000 // Refetch every 10 seconds
    });

    // Apply moderation suggestion
    const applyMutation = useMutation({
        mutationFn: async ({ roundId, locationId, fieldName, proposedValue, proposedTags, currentValue }) => {
            setProcessingRoundId(roundId);
            const response = await api.functions.invoke('applyModerationRound', {
                roundId,
                locationId,
                fieldName,
                proposedValue,
                proposedTags
            });

            if (response.data?.error || !response.data?.success) {
                throw new Error(response.data?.error || 'Failed to apply moderation');
            }

            return response.data;
        },
        onSuccess: () => {
            setProcessingRoundId(null);
            refetchRounds();
            queryClient.invalidateQueries(['admin-locations']);
            toast.success('Изменения применены');
        },
        onError: (error) => {
            setProcessingRoundId(null);
            console.error('Apply mutation error:', error);
            toast.error(`Ошибка применения: ${error.message || 'Неизвестная ошибка'}`);
        }
    });

    // Reject moderation suggestion
    const rejectMutation = useMutation({
        mutationFn: async (roundId) => {
            setProcessingRoundId(roundId);
            const response = await api.functions.invoke('rejectModerationRound', {
                roundId
            });

            if (response.data?.error || !response.data?.success) {
                throw new Error(response.data?.error || 'Failed to reject moderation');
            }

            return response.data;
        },
        onSuccess: () => {
            setProcessingRoundId(null);
            refetchRounds();
            toast.success('Предложение отклонено');
        },
        onError: (error) => {
            setProcessingRoundId(null);
            console.error('Reject mutation error:', error);
            toast.error(`Ошибка отклонения: ${error.message || 'Неизвестная ошибка'}`);
        }
    });

    // Run manual check
    const handleRunCheck = async () => {
        setRunningCheck(true);
        setShowCheckDialog(false);

        try {
            const payload = {};
            if (checkCountry !== 'all') payload.country = checkCountry;
            if (checkCity !== 'all') payload.city = checkCity;

            const response = await api.functions.invoke('locationModerationAutomation', payload);

            if (response.data.error) {
                throw new Error(response.data.error);
            }

            toast.success(`Проверка завершена: ${response.data.summary || 'Готово'}`);
            queryClient.invalidateQueries(['moderationRounds']);
            queryClient.invalidateQueries(['admin-moderation-rounds']);
            queryClient.invalidateQueries(['moderation-check-history']);
            await refetchRounds();

            // Reset filters
            setCheckCountry('all');
            setCheckCity('all');
        } catch (error) {
            console.error('Check error:', error);
            toast.error('Ошибка при проверке: ' + (error.message || 'Неизвестная ошибка'));
        } finally {
            setRunningCheck(false);
        }
    };

    const fieldLabels = {
        'opening_hours': 'Часы работы',
        'insider_tip': 'Инсайдерский совет',
        'must_try': 'Обязательно попробовать',
        'special_labels': 'Специальные метки'
    };

    return (
        <>
            {/* Check Dialog with Filters */}
            <Dialog open={showCheckDialog} onOpenChange={setShowCheckDialog}>
                <DialogContent className="dark:bg-neutral-800 dark:border-neutral-700 max-w-md">
                    <DialogHeader>
                        <DialogTitle className="dark:text-neutral-100">Запустить проверку локаций</DialogTitle>
                        <DialogDescription className="dark:text-neutral-400">
                            Выберите страну и/или город для проверки (или оставьте "Все" для проверки всех локаций)
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div>
                            <Label className="text-sm mb-2 block dark:text-neutral-300">Страна</Label>
                            <Select value={checkCountry} onValueChange={setCheckCountry}>
                                <SelectTrigger className="dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Все страны</SelectItem>
                                    {countries.map(c => (
                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {checkCountry !== 'all' && cities.length > 0 && (
                            <div>
                                <Label className="text-sm mb-2 block dark:text-neutral-300">Город</Label>
                                <Select value={checkCity} onValueChange={setCheckCity}>
                                    <SelectTrigger className="dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Все города</SelectItem>
                                        {cities.map(c => (
                                            <SelectItem key={c} value={c}>{c}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-3">
                            <p className="text-xs text-blue-900 dark:text-blue-200">
                                ℹ️ Проверка не затрагивает локации, обновленные за последние 7 дней
                            </p>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowCheckDialog(false);
                                    setCheckCountry('all');
                                    setCheckCity('all');
                                }}
                                className="flex-1"
                            >
                                Отмена
                            </Button>
                            <Button
                                onClick={handleRunCheck}
                                disabled={runningCheck}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                {runningCheck ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Проверка...
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-4 h-4 mr-2" />
                                        Запустить
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <div className="space-y-6 pb-20 md:pb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-neutral-100">Управление AI</h2>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                            Настройки и управление AI-функциями приложения
                        </p>
                    </div>
                </div>

                <Tabs defaultValue="auto-check" className="w-full">
                    <TabsList className="grid grid-cols-3 md:w-auto md:inline-grid bg-neutral-100 dark:bg-neutral-800 mb-6">
                        <TabsTrigger value="auto-check" className="text-xs md:text-sm">
                            <Bot className="w-4 h-4 mr-1.5 hidden md:block" />
                            Авто-проверка
                        </TabsTrigger>
                        <TabsTrigger value="ai-guide" className="text-xs md:text-sm">
                            <MessageSquare className="w-4 h-4 mr-1.5 hidden md:block" />
                            AI Guide
                        </TabsTrigger>
                        <TabsTrigger value="ai-assistant" className="text-xs md:text-sm">
                            <Sparkles className="w-4 h-4 mr-1.5 hidden md:block" />
                            AI Помощник
                        </TabsTrigger>
                        <TabsTrigger value="admin-agent" className="text-xs md:text-sm">
                            <Bot className="w-4 h-4 mr-1.5 hidden md:block" />
                            Admin Copilot
                        </TabsTrigger>
                        <TabsTrigger value="content-agents" className="text-xs md:text-sm">
                            <Bot className="w-4 h-4 mr-1.5 hidden md:block" />
                            Контент-агенты
                        </TabsTrigger>
                        <TabsTrigger value="playground" className="text-xs md:text-sm">
                            <Play className="w-4 h-4 mr-1.5 hidden md:block" />
                            Test Playground
                        </TabsTrigger>
                    </TabsList>

                    {/* Auto-check Tab */}
                    <TabsContent value="auto-check" className="space-y-4">
                        {/* System Prompt Configuration */}
                        <Card className="dark:bg-neutral-800 dark:border-neutral-700">
                            <CardHeader>
                                <CardTitle className="text-lg md:text-xl dark:text-neutral-100">Системный промпт для модерации</CardTitle>
                                <CardDescription className="text-sm dark:text-neutral-400">
                                    Настройте поведение AI при анализе локаций и создании предложений
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Textarea
                                    value={getPromptValue('admin_copilot', 'Вы - AI-помощник для модерации локаций. Анализируйте отзывы и предлагайте релевантные обновления для полей insider_tip, must_try и special_labels. Будьте точными и основывайтесь только на конкретных упоминаниях в отзывах.')}
                                    onChange={(e) => setPromptEdits({ ...promptEdits, admin_copilot: e.target.value })}
                                    rows={4}
                                    className="text-sm dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700"
                                />
                                <Button
                                    onClick={() => handleSavePrompt('admin_copilot', 'Промпт для автоматической проверки и модерации локаций')}
                                    disabled={savingPrompt === 'admin_copilot'}
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    {savingPrompt === 'admin_copilot' ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <Save className="w-4 h-4 mr-2" />
                                    )}
                                    Сохранить промпт
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="dark:bg-neutral-800 dark:border-neutral-700">
                            <CardHeader>
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div>
                                        <CardTitle className="text-lg md:text-xl dark:text-neutral-100">Автоматическая проверка локаций</CardTitle>
                                        <CardDescription className="text-sm dark:text-neutral-400">
                                            AI проверяет время работы и анализирует отзывы для локаций
                                        </CardDescription>
                                    </div>
                                    <Button
                                        onClick={() => setShowCheckDialog(true)}
                                        disabled={runningCheck}
                                        className="w-full md:w-auto"
                                    >
                                        {runningCheck ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Проверка...
                                            </>
                                        ) : (
                                            <>
                                                <Play className="w-4 h-4 mr-2" />
                                                Запустить проверку
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-3 md:p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                        <div>
                                            <p className="font-medium text-sm md:text-base text-neutral-900 dark:text-neutral-100">Расписание</p>
                                            <p className="text-xs md:text-sm text-neutral-600 dark:text-neutral-400">Каждый месяц, 1-го числа</p>
                                        </div>
                                    </div>
                                    <Badge variant="secondary" className="text-xs">Активно</Badge>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="font-semibold text-sm md:text-base text-neutral-900 dark:text-neutral-100">Что проверяется:</h4>
                                    <ul className="space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
                                        <li className="flex items-start gap-2">
                                            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                                            <span>Актуальные часы работы через Google Places API</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                                            <span>Анализ новых отзывов на похожие рекомендации</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                                            <span>Предложения по обновлению insider tips и must try</span>
                                        </li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Check History */}
                        <Card className="dark:bg-neutral-800 dark:border-neutral-700">
                            <CardHeader>
                                <CardTitle className="text-lg md:text-xl dark:text-neutral-100">
                                    История запусков
                                </CardTitle>
                                <CardDescription className="text-sm dark:text-neutral-400">
                                    Последние запуски автоматической проверки
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loadingHistory ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
                                    </div>
                                ) : checkHistory.length === 0 ? (
                                    <div className="text-center py-8 text-neutral-600 dark:text-neutral-400 text-sm">
                                        <Clock className="w-12 h-12 mx-auto mb-3 text-neutral-400 dark:text-neutral-600" />
                                        <p>Пока нет записей</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {/* Latest 2 entries */}
                                        <div className="space-y-2">
                                            {checkHistory.slice(0, 2).map((entry) => (
                                                <div
                                                    key={entry.id}
                                                    className="bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden"
                                                >
                                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 p-3">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <Badge
                                                                    variant={entry.triggered_by === 'manual' ? 'default' : 'secondary'}
                                                                    className="text-xs"
                                                                >
                                                                    {entry.triggered_by === 'manual' ? '🖱️ Вручную' : '⏰ Автоматически'}
                                                                </Badge>
                                                                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                                                    {new Date(entry.check_date).toLocaleString('ru-RU', {
                                                                        day: 'numeric',
                                                                        month: 'short',
                                                                        year: 'numeric',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    })}
                                                                </span>
                                                            </div>
                                                            {entry.admin_email && (
                                                                <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                                                                    Запустил: {entry.admin_email}
                                                                </p>
                                                            )}
                                                            {entry.filters && (entry.filters.country || entry.filters.city) && (
                                                                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                                                                    Фильтр: {entry.filters.country || 'Все страны'}
                                                                    {entry.filters.city && ` → ${entry.filters.city}`}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-3 text-xs">
                                                            <div className="text-right">
                                                                <p className="text-neutral-900 dark:text-neutral-100 font-medium">
                                                                    {entry.results?.suggestionsCreated || 0} предложений
                                                                </p>
                                                                <p className="text-neutral-500 dark:text-neutral-400">
                                                                    {entry.results?.openingHoursUpdated || 0} часов, {entry.results?.reviewsAnalyzed || 0} отзывов
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Suggestions Log */}
                                                    {entry.results?.suggestions && entry.results.suggestions.length > 0 && (
                                                        <div className="px-3 pb-3 pt-1 border-t border-neutral-200 dark:border-neutral-700">
                                                            <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mb-2 uppercase tracking-wide">Создано предложений:</p>
                                                            <div className="space-y-1 max-h-32 overflow-y-auto">
                                                                {entry.results.suggestions.map((sug, idx) => (
                                                                    <div key={idx} className="text-xs bg-white dark:bg-neutral-800 rounded px-2 py-1 flex items-start gap-2">
                                                                        <Badge variant="outline" className="text-[9px] shrink-0">
                                                                            {sug.field === 'opening_hours' ? '🕐' : sug.field === 'must_try' ? '🍽️' : '💡'}
                                                                        </Badge>
                                                                        <span className="text-neutral-900 dark:text-neutral-100 font-medium truncate">{sug.location_name}</span>
                                                                        <span className="text-neutral-500 dark:text-neutral-400 text-[10px] ml-auto shrink-0">{sug.status === 'pending' ? '⏳' : '✅'}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Collapsible older entries */}
                                        {checkHistory.length > 2 && (
                                            <>
                                                {showAllHistory && (
                                                    <div className="space-y-2">
                                                        {checkHistory.slice(2, 10).map((entry) => (
                                                            <div
                                                                key={entry.id}
                                                                className="bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden"
                                                            >
                                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 p-3">
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <Badge
                                                                                variant={entry.triggered_by === 'manual' ? 'default' : 'secondary'}
                                                                                className="text-xs"
                                                                            >
                                                                                {entry.triggered_by === 'manual' ? '🖱️ Вручную' : '⏰ Автоматически'}
                                                                            </Badge>
                                                                            <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                                                                {new Date(entry.check_date).toLocaleString('ru-RU', {
                                                                                    day: 'numeric',
                                                                                    month: 'short',
                                                                                    year: 'numeric',
                                                                                    hour: '2-digit',
                                                                                    minute: '2-digit'
                                                                                })}
                                                                            </span>
                                                                        </div>
                                                                        {entry.admin_email && (
                                                                            <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                                                                                Запустил: {entry.admin_email}
                                                                            </p>
                                                                        )}
                                                                        {entry.filters && (entry.filters.country || entry.filters.city) && (
                                                                            <p className="text-xs text-neutral-600 dark:text-neutral-400">
                                                                                Фильтр: {entry.filters.country || 'Все страны'}
                                                                                {entry.filters.city && ` → ${entry.filters.city}`}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center gap-3 text-xs">
                                                                        <div className="text-right">
                                                                            <p className="text-neutral-900 dark:text-neutral-100 font-medium">
                                                                                {entry.results?.suggestionsCreated || 0} предложений
                                                                            </p>
                                                                            <p className="text-neutral-500 dark:text-neutral-400">
                                                                                {entry.results?.openingHoursUpdated || 0} часов, {entry.results?.reviewsAnalyzed || 0} отзывов
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Suggestions Log */}
                                                                {entry.results?.suggestions && entry.results.suggestions.length > 0 && (
                                                                    <div className="px-3 pb-3 pt-1 border-t border-neutral-200 dark:border-neutral-700">
                                                                        <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mb-2 uppercase tracking-wide">Создано предложений:</p>
                                                                        <div className="space-y-1 max-h-32 overflow-y-auto">
                                                                            {entry.results.suggestions.map((sug, idx) => (
                                                                                <div key={idx} className="text-xs bg-white dark:bg-neutral-800 rounded px-2 py-1 flex items-start gap-2">
                                                                                    <Badge variant="outline" className="text-[9px] shrink-0">
                                                                                        {sug.field === 'opening_hours' ? '🕐' : sug.field === 'must_try' ? '🍽️' : '💡'}
                                                                                    </Badge>
                                                                                    <span className="text-neutral-900 dark:text-neutral-100 font-medium truncate">{sug.location_name}</span>
                                                                                    <span className="text-neutral-500 dark:text-neutral-400 text-[10px] ml-auto shrink-0">{sug.status === 'pending' ? '⏳' : '✅'}</span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setShowAllHistory(!showAllHistory)}
                                                    className="w-full"
                                                >
                                                    {showAllHistory ? 'Скрыть' : `Показать ещё (${Math.min(checkHistory.length - 2, 8)})`}
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Pending Moderation Rounds */}
                        <Card className="dark:bg-neutral-800 dark:border-neutral-700">
                            <CardHeader>
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div>
                                        <CardTitle className="text-lg md:text-xl dark:text-neutral-100">
                                            Предложения AI ({moderationRounds.length})
                                        </CardTitle>
                                        <CardDescription className="text-sm dark:text-neutral-400">
                                            Рекомендации по обновлению информации о локациях
                                        </CardDescription>
                                    </div>
                                    {moderationRounds.filter(r => r.field_name === 'opening_hours').length > 0 && (
                                        <Button
                                            onClick={async () => {
                                                try {
                                                    toast.info('Переформатирование часов работы...');
                                                    const response = await api.functions.invoke('reformatExistingOpeningHours');
                                                    if (response.data?.success) {
                                                        toast.success(`Переформатировано: ${response.data.results.reformatted} из ${response.data.results.total}`);
                                                        refetchRounds();
                                                    } else {
                                                        toast.error('Ошибка переформатирования');
                                                    }
                                                } catch (error) {
                                                    console.error('Reformat error:', error);
                                                    toast.error('Ошибка переформатирования: ' + error.message);
                                                }
                                            }}
                                            variant="outline"
                                            size="sm"
                                            className="whitespace-nowrap bg-white dark:bg-neutral-900"
                                        >
                                            ✨ Переформатировать часы
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                {loadingRounds ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
                                    </div>
                                ) : moderationRounds.length === 0 ? (
                                    <div className="text-center py-8 text-neutral-600 dark:text-neutral-400 text-sm">
                                        <AlertCircle className="w-12 h-12 mx-auto mb-3 text-neutral-400 dark:text-neutral-600" />
                                        <p>Нет новых предложений</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {moderationRounds.map((round) => (
                                            <div
                                                key={round.id}
                                                className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-3 md:p-4 space-y-3"
                                            >
                                                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-semibold text-sm md:text-base text-neutral-900 dark:text-neutral-100 truncate">
                                                            {round.location_name}
                                                        </h4>
                                                        <Badge variant="outline" className="text-xs mt-1">
                                                            {fieldLabels[round.field_name] || round.field_name}
                                                        </Badge>
                                                    </div>
                                                </div>

                                                {/* Current Value */}
                                                {round.currentValue && (
                                                    <div className="bg-neutral-50 dark:bg-neutral-900 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700">
                                                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                                                            <strong>Текущее значение:</strong>
                                                        </p>
                                                        <p className="text-xs md:text-sm text-neutral-900 dark:text-neutral-100">
                                                            {round.currentValue}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Proposed Value */}
                                                {round.proposed_value && (
                                                    <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg border border-blue-200 dark:border-blue-900">
                                                        <p className="text-xs text-blue-600 dark:text-blue-300 mb-1">
                                                            <strong>Предложение AI:</strong>
                                                        </p>
                                                        <p className="text-xs md:text-sm text-blue-900 dark:text-blue-200">
                                                            {round.proposed_value}
                                                        </p>
                                                    </div>
                                                )}

                                                {round.proposed_tags && round.proposed_tags.length > 0 && (
                                                    <div className="flex flex-wrap gap-1">
                                                        {round.proposed_tags.map((tag, idx) => (
                                                            <Badge key={idx} variant="secondary" className="text-xs">
                                                                {tag}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )}

                                                <div className="flex flex-col md:flex-row gap-2 pt-2">
                                                    <Button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            applyMutation.mutate({
                                                                roundId: round.id,
                                                                locationId: round.location_id,
                                                                fieldName: round.field_name,
                                                                proposedValue: round.proposed_value,
                                                                proposedTags: round.proposed_tags,
                                                                currentValue: round.currentValue
                                                            });
                                                        }}
                                                        disabled={processingRoundId !== null}
                                                        size="sm"
                                                        className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white"
                                                    >
                                                        {processingRoundId === round.id && applyMutation.isPending ? (
                                                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                                        ) : (
                                                            <CheckCircle className="w-4 h-4 mr-1" />
                                                        )}
                                                        Применить
                                                    </Button>
                                                    <Button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            rejectMutation.mutate(round.id);
                                                        }}
                                                        disabled={processingRoundId !== null}
                                                        variant="outline"
                                                        size="sm"
                                                        className="flex-1 md:flex-none"
                                                    >
                                                        {processingRoundId === round.id && rejectMutation.isPending ? (
                                                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                                        ) : (
                                                            'Отклонить'
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* AI Guide Tab */}
                    <TabsContent value="ai-guide" className="space-y-4">
                        <Card className="dark:bg-neutral-800 dark:border-neutral-700">
                            <CardHeader>
                                <CardTitle className="text-lg md:text-xl dark:text-neutral-100">AI Guide для пользователей</CardTitle>
                                <CardDescription className="text-sm dark:text-neutral-400">
                                    Настройки персонального AI-помощника для поиска и рекомендаций
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-sm md:text-base dark:text-neutral-200">Системный промпт</Label>
                                    <Textarea
                                        value={getPromptValue('user_guide', 'Вы - дружелюбный AI-помощник, который помогает пользователям найти идеальные места для посещения. Учитывайте предпочтения пользователя и давайте персонализированные рекомендации.')}
                                        onChange={(e) => setPromptEdits({ ...promptEdits, user_guide: e.target.value })}
                                        rows={4}
                                        className="text-sm dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700"
                                    />
                                </div>

                                <Button
                                    onClick={() => handleSavePrompt('user_guide', 'Системный промпт для AI-гида')}
                                    disabled={savingPrompt === 'user_guide'}
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    {savingPrompt === 'user_guide' ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <Save className="w-4 h-4 mr-2" />
                                    )}
                                    Сохранить промпт
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Admin Agent Tab */}
                    <TabsContent value="admin-agent" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Chat Interface */}
                            <Card className="h-[600px] flex flex-col dark:bg-neutral-800 dark:border-neutral-700">
                                <CardHeader>
                                    <CardTitle className="text-lg md:text-xl dark:text-neutral-100">Admin Copilot Chat</CardTitle>
                                    <CardDescription className="text-sm dark:text-neutral-400">
                                        Выполняйте команды и получайте статистику через AI
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 flex flex-col min-h-0">
                                    <div className="flex-1 overflow-y-auto space-y-4 p-4 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 mb-4">
                                        {adminChatMessages.length === 0 ? (
                                            <div className="text-center text-neutral-500 mt-20">
                                                <Bot className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                                <p>Введите команду, например "Show statistics" или "Check for missing descriptions"</p>
                                            </div>
                                        ) : (
                                            adminChatMessages.map((msg, idx) => (
                                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[85%] rounded-lg p-3 ${msg.role === 'user'
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700'
                                                        }`}>
                                                        <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                                                        {msg.tool && (
                                                            <Badge variant="outline" className="mt-2 text-[10px] bg-neutral-100 dark:bg-neutral-900">
                                                                🛠️ Used tool: {msg.tool}
                                                            </Badge>
                                                        )}
                                                        {msg.data && (
                                                            <pre className="mt-2 p-2 bg-black/10 rounded text-[10px] overflow-x-auto">
                                                                {JSON.stringify(msg.data, null, 2)}
                                                            </pre>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                        {adminChatLoading && (
                                            <div className="flex justify-start">
                                                <div className="bg-white dark:bg-neutral-800 rounded-lg p-3 border border-neutral-200 dark:border-neutral-700">
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <form
                                        onSubmit={async (e) => {
                                            e.preventDefault();
                                            if (!adminChatInput.trim() || adminChatLoading) return;

                                            const userMsg = { role: 'user', content: adminChatInput };
                                            setAdminChatMessages(prev => [...prev, userMsg]);
                                            setAdminChatInput('');
                                            setAdminChatLoading(true);

                                            try {
                                                const response = await api.functions.invoke('ai-admin-actions', {
                                                    command: userMsg.content,
                                                    context: {}
                                                });

                                                if (response.error) throw new Error(response.error.message);
                                                const data = response.data;

                                                const aiMsg = {
                                                    role: 'assistant',
                                                    content: data.result,
                                                    data: data.data,
                                                    tool: data.tool_used
                                                };
                                                setAdminChatMessages(prev => [...prev, aiMsg]);

                                            } catch (err) {
                                                console.error(err);
                                                setAdminChatMessages(prev => [...prev, { role: 'assistant', content: 'Ошибка при выполнении: ' + (err.message || 'Unknown error') }]);
                                            } finally {
                                                setAdminChatLoading(false);
                                            }
                                        }}
                                        className="flex gap-2"
                                    >
                                        <Textarea
                                            value={adminChatInput}
                                            onChange={(e) => setAdminChatInput(e.target.value)}
                                            placeholder="Команда для AI агента..."
                                            className="resize-none dark:bg-neutral-900"
                                            rows={2}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    e.currentTarget.form.requestSubmit();
                                                }
                                            }}
                                        />
                                        <Button type="submit" disabled={adminChatLoading || !adminChatInput.trim()} className="bg-blue-600 hover:bg-blue-700 text-white self-end">
                                            <Play className="w-4 h-4" />
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>

                            {/* Settings for Admin Agent */}
                            <div className="space-y-4">
                                <Card className="dark:bg-neutral-800 dark:border-neutral-700">
                                    <CardHeader>
                                        <CardTitle className="text-lg md:text-xl dark:text-neutral-100">Настройки Агента</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="dark:text-neutral-200">Системный промпт</Label>
                                            <Textarea
                                                value={getPromptValue('admin_copilot', 'You are an admin assistant.')}
                                                onChange={(e) => setPromptEdits({ ...promptEdits, admin_copilot: e.target.value })}
                                                rows={10}
                                                className="text-sm dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700"
                                            />
                                        </div>
                                        <Button
                                            onClick={() => handleSavePrompt('admin_copilot', 'Промпт для AI Admin Copilot')}
                                            disabled={savingPrompt === 'admin_copilot'}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                        >
                                            {savingPrompt === 'admin_copilot' ? (
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            ) : (
                                                <Save className="w-4 h-4 mr-2" />
                                            )}
                                            Сохранить промпт
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Content Agents Tab */}
                    <TabsContent value="content-agents" className="space-y-4">
                        <Card className="dark:bg-neutral-800 dark:border-neutral-700">
                            <CardHeader>
                                <CardTitle className="text-lg md:text-xl dark:text-neutral-100">Контент-агенты</CardTitle>
                                <CardDescription className="text-sm dark:text-neutral-400">
                                    Настройка промптов для генерации и перевода контента
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-8">
                                {/* Smart Fill Agent */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-base font-semibold dark:text-neutral-200">Smart Fill (Анализ Google Maps)</Label>
                                        <Badge variant="outline">location_smart_fill</Badge>
                                    </div>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                        Отвечает за анализ отзывов и данных из Google Places для первичного заполнения локации.
                                    </p>
                                    <Textarea
                                        value={getPromptValue('location_smart_fill', '')}
                                        onChange={(e) => setPromptEdits({ ...promptEdits, location_smart_fill: e.target.value })}
                                        rows={6}
                                        className="text-sm dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700 font-mono"
                                    />
                                    <Button
                                        onClick={() => handleSavePrompt('location_smart_fill', 'Smart Fill Agent')}
                                        disabled={savingPrompt === 'location_smart_fill'}
                                        size="sm"
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        {savingPrompt === 'location_smart_fill' ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Save className="w-3 h-3 mr-2" />}
                                        Сохранить Smart Fill
                                    </Button>
                                </div>

                                <div className="h-px bg-neutral-200 dark:bg-neutral-700" />

                                {/* Content Generator Agent */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-base font-semibold dark:text-neutral-200">Content Generator (Копирайтер)</Label>
                                        <Badge variant="outline">content_generator</Badge>
                                    </div>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                        Улучшает описания, советы и рекомендации (description, insider_tip, must_try).
                                    </p>
                                    <Textarea
                                        value={getPromptValue('content_generator', '')}
                                        onChange={(e) => setPromptEdits({ ...promptEdits, content_generator: e.target.value })}
                                        rows={6}
                                        className="text-sm dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700 font-mono"
                                    />
                                    <Button
                                        onClick={() => handleSavePrompt('content_generator', 'Content Generator Agent')}
                                        disabled={savingPrompt === 'content_generator'}
                                        size="sm"
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        {savingPrompt === 'content_generator' ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Save className="w-3 h-3 mr-2" />}
                                        Сохранить Content Generator
                                    </Button>
                                </div>

                                <div className="h-px bg-neutral-200 dark:bg-neutral-700" />

                                {/* Translator Agent */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-base font-semibold dark:text-neutral-200">Translator (Переводчик)</Label>
                                        <Badge variant="outline">translator</Badge>
                                    </div>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                        Переводит контент на английский язык, сохраняя стиль и тональность.
                                    </p>
                                    <Textarea
                                        value={getPromptValue('translator', '')}
                                        onChange={(e) => setPromptEdits({ ...promptEdits, translator: e.target.value })}
                                        rows={6}
                                        className="text-sm dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700 font-mono"
                                    />
                                    <Button
                                        onClick={() => handleSavePrompt('translator', 'Translator Agent')}
                                        disabled={savingPrompt === 'translator'}
                                        size="sm"
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        {savingPrompt === 'translator' ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Save className="w-3 h-3 mr-2" />}
                                        Сохранить Translator
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Test Playground Tab */}
                    <TabsContent value="playground" className="h-[730px]">
                        <AITestPlayground aiPrompts={aiPrompts} />
                    </TabsContent>

                    {/* AI Assistant Tab */}
                    <TabsContent value="ai-assistant" className="space-y-4">
                        <Tabs defaultValue="general" className="w-full">
                            <TabsList className="grid grid-cols-2 md:w-auto md:inline-grid bg-neutral-100 dark:bg-neutral-800 mb-4">
                                <TabsTrigger value="general" className="text-xs md:text-sm">
                                    Создание локаций
                                </TabsTrigger>
                                <TabsTrigger value="fields" className="text-xs md:text-sm">
                                    Заполнение полей
                                </TabsTrigger>
                            </TabsList>

                            {/* General Assistant Tab */}
                            <TabsContent value="general">
                                <Card className="dark:bg-neutral-800 dark:border-neutral-700">
                                    <CardHeader>
                                        <CardTitle className="text-lg md:text-xl dark:text-neutral-100">AI Помощник создания локаций</CardTitle>
                                        <CardDescription className="text-sm dark:text-neutral-400">
                                            Общий промпт для поиска и создания новых мест
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-sm md:text-base dark:text-neutral-200">Системный промпт</Label>
                                            <Textarea
                                                value={getPromptValue('ai_assistant', 'Вы - AI-ассистент для создания локаций. Помогайте пользователю найти информацию о заведениях через Google Maps, социальные сети и другие источники. Будьте точными и предоставляйте только проверенные данные.')}
                                                onChange={(e) => setPromptEdits({ ...promptEdits, ai_assistant: e.target.value })}
                                                rows={6}
                                                className="text-sm dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700"
                                            />
                                        </div>

                                        <Button
                                            onClick={() => handleSavePrompt('ai_assistant', 'Промпт для AI-ассистента при создании локаций')}
                                            disabled={savingPrompt === 'ai_assistant'}
                                            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                                        >
                                            {savingPrompt === 'ai_assistant' ? (
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            ) : (
                                                <Save className="w-4 h-4 mr-2" />
                                            )}
                                            Сохранить промпт
                                        </Button>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Location Fields Tab */}
                            <TabsContent value="fields">
                                <Card className="dark:bg-neutral-800 dark:border-neutral-700">
                                    <CardHeader>
                                        <CardTitle className="text-lg md:text-xl dark:text-neutral-100">Заполнение полей локации</CardTitle>
                                        <CardDescription className="text-sm dark:text-neutral-400">
                                            Промпт для автозаполнения описания, инсайдерских советов и must-try рекомендаций
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-sm md:text-base dark:text-neutral-200">Системный промпт для заполнения полей</Label>
                                            <Textarea
                                                value={getPromptValue('ai_location_fields', 'Вы - AI-помощник для заполнения полей локаций. На основе названия, адреса и типа заведения создавайте:\n\n1. Описание (description) - краткое и привлекательное описание заведения на 2-3 предложения\n2. Инсайдерский совет (insider_tip) - полезный совет для посетителей\n3. Что попробовать (must_try) - рекомендации блюд/напитков\n\nИспользуйте информацию из Google Maps, отзывов и социальных сетей. Пишите естественно и увлекательно.')}
                                                onChange={(e) => setPromptEdits({ ...promptEdits, ai_location_fields: e.target.value })}
                                                rows={8}
                                                className="text-sm dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700"
                                            />
                                        </div>

                                        <Button
                                            onClick={() => handleSavePrompt('ai_location_fields', 'Промпт для автозаполнения полей локации (описание, инсайдерские советы, must-try)')}
                                            disabled={savingPrompt === 'ai_location_fields'}
                                            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                                        >
                                            {savingPrompt === 'ai_location_fields' ? (
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            ) : (
                                                <Save className="w-4 h-4 mr-2" />
                                            )}
                                            Сохранить промпт
                                        </Button>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </TabsContent>
                </Tabs>
            </div>
        </>
    );
}