import React, { useState } from 'react';
import { base44 } from '@/api/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { 
    MapPin, Search, CheckCircle2, Loader2, Filter
} from "lucide-react";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

export default function ModerationLocationsTab({ locations }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCountry, setFilterCountry] = useState('all');
    const [filterCity, setFilterCity] = useState('all');
    const [selectedLocations, setSelectedLocations] = useState([]);
    const [showFieldsDialog, setShowFieldsDialog] = useState(false);
    const [selectedFields, setSelectedFields] = useState({
        insider_tip: true,
        must_try: true,
        special_labels: true
    });
    const queryClient = useQueryClient();

    const sendToModerationMutation = useMutation({
        mutationFn: async ({ locationIds, fields }) => {
            // Проверяем существующие активные раунды модерации
            const allRounds = await base44.entities.ModerationRound.list();
            const existingRounds = allRounds.filter(r => 
                r.status === 'pending_creator_answers' || r.status === 'pending_admin_review'
            );

            // Создаем Set для быстрой проверки существующих комбинаций
            const existingKeys = new Set(
                existingRounds.map(r => `${r.location_id}_${r.field_name}`)
            );

            const rounds = [];
            let skippedCount = 0;
            
            for (const locationId of locationIds) {
                const location = locations.find(l => l.id === locationId);
                if (!location) continue;

                // Создаём раунды модерации для выбранных полей
                if (fields.insider_tip && location.insider_tip) {
                    const key = `${locationId}_insider_tip`;
                    if (!existingKeys.has(key)) {
                        rounds.push({
                            location_id: locationId,
                            location_name: location.name,
                            field_name: 'insider_tip',
                            proposed_value: location.insider_tip,
                            status: 'pending_creator_answers',
                            created_by: 'admin',
                            round_number: 1
                        });
                    } else {
                        skippedCount++;
                    }
                }

                if (fields.must_try && location.must_try) {
                    const key = `${locationId}_must_try`;
                    if (!existingKeys.has(key)) {
                        rounds.push({
                            location_id: locationId,
                            location_name: location.name,
                            field_name: 'must_try',
                            proposed_value: location.must_try,
                            status: 'pending_creator_answers',
                            created_by: 'admin',
                            round_number: 1
                        });
                    } else {
                        skippedCount++;
                    }
                }

                if (fields.special_labels && location.special_labels?.length > 0) {
                    const key = `${locationId}_special_labels`;
                    if (!existingKeys.has(key)) {
                        rounds.push({
                            location_id: locationId,
                            location_name: location.name,
                            field_name: 'special_labels',
                            proposed_tags: location.special_labels,
                            status: 'pending_creator_answers',
                            created_by: 'admin',
                            round_number: 1
                        });
                    } else {
                        skippedCount++;
                    }
                }
            }

            if (rounds.length === 0 && skippedCount === 0) {
                throw new Error('Не выбраны поля или локации не содержат данных для модерации');
            }

            if (rounds.length === 0 && skippedCount > 0) {
                throw new Error(`Все выбранные раунды уже существуют в модерации (пропущено: ${skippedCount})`);
            }

            // Создаём новые раунды модерации
            const result = rounds.length > 0 ? await base44.entities.ModerationRound.bulkCreate(rounds) : [];
            
            return { created: result, skipped: skippedCount };
        },
        onSuccess: (result, { locationIds }) => {
            queryClient.invalidateQueries(['admin-moderation-rounds']);
            queryClient.invalidateQueries(['creatorTasksCount']);
            setSelectedLocations([]);
            setShowFieldsDialog(false);
            
            const message = result.skipped > 0 
                ? `Создано ${result.created.length} раундов для ${locationIds.length} локаций (пропущено дубликатов: ${result.skipped})`
                : `Создано ${result.created.length} раундов модерации для ${locationIds.length} локаций`;
            
            toast.success(message);
        },
        onError: (error) => {
            toast.error('Ошибка: ' + (error.message || 'Не удалось создать раунды модерации'));
        }
    });

    const filteredLocations = locations.filter(loc => {
        const matchesSearch = 
            loc.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            loc.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            loc.country?.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesCountry = filterCountry === 'all' || loc.country === filterCountry;
        const matchesCity = filterCity === 'all' || loc.city === filterCity;

        return matchesSearch && matchesCountry && matchesCity;
    });

    const toggleLocation = (locationId) => {
        setSelectedLocations(prev => 
            prev.includes(locationId) 
                ? prev.filter(id => id !== locationId)
                : [...prev, locationId]
        );
    };

    const toggleAll = () => {
        if (selectedLocations.length === filteredLocations.length) {
            setSelectedLocations([]);
        } else {
            setSelectedLocations(filteredLocations.map(l => l.id));
        }
    };

    const availableCountries = [...new Set(locations.map(l => l.country))].filter(Boolean).sort();
    const availableCities = [...new Set(
        locations
            .filter(l => filterCountry === 'all' || l.country === filterCountry)
            .map(l => l.city)
            .filter(Boolean)
    )].sort();

    return (
        <div className="space-y-4">
            {/* Filters and Actions */}
            <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                    <Input 
                        placeholder="Поиск локаций..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700"
                    />
                </div>
                <div className="flex gap-2">
                    <Select value={filterCountry} onValueChange={setFilterCountry}>
                        <SelectTrigger className="w-[140px] text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700">
                            <SelectValue placeholder="Страна" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Все страны</SelectItem>
                            {availableCountries.map(c => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={filterCity} onValueChange={setFilterCity}>
                        <SelectTrigger className="w-[140px] text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700">
                            <SelectValue placeholder="Город" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Все города</SelectItem>
                            {availableCities.map(c => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Selection Actions */}
            {selectedLocations.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-950/30 border-0 shadow-sm dark:border dark:border-blue-900 rounded-xl p-4 flex items-center justify-between">
                    <span className="text-sm font-medium text-neutral-900 dark:text-blue-200">
                        Выбрано: {selectedLocations.length} локаций
                    </span>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedLocations([])}
                        >
                            Отменить выбор
                        </Button>
                        <Button
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-700"
                            onClick={() => setShowFieldsDialog(true)}
                        >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Отправить на модерацию
                        </Button>
                    </div>
                </div>
            )}

            {/* Fields Selection Dialog */}
            <Dialog open={showFieldsDialog} onOpenChange={setShowFieldsDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Выберите поля для модерации</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <p className="text-sm text-neutral-900 dark:text-neutral-300">
                            Будут созданы раунды модерации для {selectedLocations.length} локаций. Выберите какие поля нужно проверить креаторами:
                        </p>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 border-0 shadow-sm dark:border dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900">
                                <Checkbox
                                    checked={selectedFields.insider_tip}
                                    onCheckedChange={(checked) => 
                                        setSelectedFields(prev => ({ ...prev, insider_tip: checked }))
                                    }
                                />
                                <Label className="flex-1 cursor-pointer text-neutral-900 dark:text-neutral-100">
                                    <div className="font-medium">Инсайдерский совет</div>
                                    <div className="text-xs text-neutral-700 dark:text-neutral-400">Проверка insider_tip</div>
                                </Label>
                            </div>
                            <div className="flex items-center gap-3 p-3 border-0 shadow-sm dark:border dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900">
                                <Checkbox
                                    checked={selectedFields.must_try}
                                    onCheckedChange={(checked) => 
                                        setSelectedFields(prev => ({ ...prev, must_try: checked }))
                                    }
                                />
                                <Label className="flex-1 cursor-pointer text-neutral-900 dark:text-neutral-100">
                                    <div className="font-medium">Что попробовать</div>
                                    <div className="text-xs text-neutral-700 dark:text-neutral-400">Проверка must_try</div>
                                </Label>
                            </div>
                            <div className="flex items-center gap-3 p-3 border-0 shadow-sm dark:border dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900">
                                <Checkbox
                                    checked={selectedFields.special_labels}
                                    onCheckedChange={(checked) => 
                                        setSelectedFields(prev => ({ ...prev, special_labels: checked }))
                                    }
                                />
                                <Label className="flex-1 cursor-pointer text-neutral-900 dark:text-neutral-100">
                                    <div className="font-medium">Специальные метки</div>
                                    <div className="text-xs text-neutral-700 dark:text-neutral-400">Проверка special_labels</div>
                                </Label>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowFieldsDialog(false)}
                        >
                            Отмена
                        </Button>
                        <Button
                            className="bg-purple-600 hover:bg-purple-700"
                            onClick={() => sendToModerationMutation.mutate({ 
                                locationIds: selectedLocations, 
                                fields: selectedFields 
                            })}
                            disabled={sendToModerationMutation.isPending || !Object.values(selectedFields).some(v => v)}
                        >
                            {sendToModerationMutation.isPending ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                            )}
                            Создать раунды
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Locations List */}
            <div className="bg-white dark:bg-neutral-800 shadow-sm border-0 dark:border dark:border-neutral-700 rounded-xl overflow-hidden">
                <div className="p-3 border-b border-neutral-100 dark:border-neutral-700 flex items-center gap-3">
                    <Checkbox
                        checked={selectedLocations.length === filteredLocations.length && filteredLocations.length > 0}
                        onCheckedChange={toggleAll}
                    />
                    <span className="text-sm font-medium text-neutral-900 dark:text-neutral-300">
                        Выбрать все ({filteredLocations.length})
                    </span>
                </div>
                <div className="divide-y divide-neutral-100 dark:divide-neutral-700 max-h-[600px] overflow-y-auto">
                    {filteredLocations.length > 0 ? (
                        filteredLocations.map(location => (
                            <div 
                                key={location.id}
                                className="p-4 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
                                onClick={() => toggleLocation(location.id)}
                            >
                                <div className="flex items-start gap-3">
                                    <Checkbox
                                        checked={selectedLocations.includes(location.id)}
                                        onCheckedChange={() => toggleLocation(location.id)}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                                                {location.name}
                                            </h3>
                                            <Badge variant="outline" className="text-xs shrink-0">
                                                {location.type}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-400">
                                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                                            <span className="truncate">{location.city}, {location.country}</span>
                                        </div>
                                        {location.description && (
                                            <p className="text-xs text-neutral-700 dark:text-neutral-400 mt-2 line-clamp-2">
                                                {location.description}
                                            </p>
                                        )}
                                    </div>
                                    {location.image_url && (
                                        <img 
                                            src={location.image_url} 
                                            alt={location.name}
                                            className="w-16 h-16 rounded-lg object-cover shrink-0"
                                        />
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-12 text-center text-neutral-500 dark:text-neutral-400">
                            <Filter className="w-12 h-12 mx-auto mb-3 text-neutral-300 dark:text-neutral-600" />
                            <p>Нет локаций, соответствующих фильтрам</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}