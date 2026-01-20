import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { enrichLocation, isGoogleMapsConfigured } from '@/utils/googleMapsEnrichment';
import { api } from '@/api/client';
import { toast } from 'sonner';

export default function SmartFillDialog({ location, onSuccess }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isEnriching, setIsEnriching] = useState(false);
    const [enrichmentResult, setEnrichmentResult] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleEnrich = async () => {
        if (!location) return;

        setIsEnriching(true);
        setEnrichmentResult(null);

        try {
            const result = await enrichLocation(location, {
                enrichCoordinates: !location.latitude || !location.longitude,
                enrichRating: true,
                enrichOpeningHours: false,
                enrichPhotos: !location.image_url,
                enrichWebsite: !location.website,
                enrichPriceRange: !location.price_range,
                delayMs: 300
            });

            setEnrichmentResult(result);

            if (!result.metadata.success) {
                toast.error('Не удалось обогатить данные: ' + (result.metadata.errors[0] || 'Место не найдено'));
            } else {
                toast.success(`Найдено ${result.metadata.fieldsEnriched.length} новых полей`);
            }
        } catch (error) {
            console.error('Enrichment error:', error);
            toast.error('Ошибка обогащения: ' + error.message);
        } finally {
            setIsEnriching(false);
        }
    };

    const handleSave = async () => {
        if (!enrichmentResult || !enrichmentResult.metadata.success) return;

        setIsSaving(true);

        try {
            const updateData = {
                ...enrichmentResult.enriched,
                last_enriched_at: new Date().toISOString()
            };

            await api.entities.Location.update(location.id, updateData);
            toast.success('Данные успешно обновлены!');
            setIsOpen(false);
            onSuccess?.();
        } catch (error) {
            console.error('Save error:', error);
            toast.error('Ошибка сохранения: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isGoogleMapsConfigured()) {
        return null;
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-blue-200 dark:border-blue-900 hover:from-blue-100 hover:to-purple-100"
                >
                    <Sparkles className="w-3.5 h-3.5 mr-2 text-blue-600 dark:text-blue-400" />
                    Smart Fill
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl dark:bg-neutral-800 dark:border-neutral-700">
                <DialogHeader>
                    <DialogTitle className="text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        Smart Fill - Автообогащение данных
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Location Info */}
                    <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-lg p-4">
                        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-2">{location?.name}</h3>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            {location?.city}, {location?.country}
                        </p>
                        {location?.address && (
                            <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">{location.address}</p>
                        )}
                    </div>

                    {/* Enrich Button */}
                    {!enrichmentResult && (
                        <div className="flex justify-center">
                            <Button
                                onClick={handleEnrich}
                                disabled={isEnriching}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                {isEnriching ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Поиск данных...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        Найти данные в Google Maps
                                    </>
                                )}
                            </Button>
                        </div>
                    )}

                    {/* Enrichment Results */}
                    {enrichmentResult && (
                        <div className="space-y-4">
                            {/* Status */}
                            <div className={`rounded-lg p-4 ${enrichmentResult.metadata.success
                                    ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900'
                                    : 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900'
                                }`}>
                                <div className="flex items-center gap-2">
                                    {enrichmentResult.metadata.success ? (
                                        <>
                                            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                                            <span className="font-semibold text-green-900 dark:text-green-100">
                                                Найдено {enrichmentResult.metadata.fieldsEnriched.length} новых полей
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                            <span className="font-semibold text-red-900 dark:text-red-100">
                                                Не удалось найти данные
                                            </span>
                                        </>
                                    )}
                                </div>
                                {enrichmentResult.metadata.errors.length > 0 && (
                                    <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                                        {enrichmentResult.metadata.errors.join(', ')}
                                    </p>
                                )}
                            </div>

                            {/* Enriched Fields */}
                            {enrichmentResult.metadata.success && Object.keys(enrichmentResult.enriched).length > 0 && (
                                <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
                                    <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                                        Найденные данные:
                                    </h4>
                                    <div className="space-y-2">
                                        {Object.entries(enrichmentResult.enriched).map(([key, value]) => (
                                            <div key={key} className="flex justify-between items-start text-sm">
                                                <span className="text-neutral-600 dark:text-neutral-400 font-medium">{key}:</span>
                                                <span className="text-neutral-900 dark:text-neutral-100 text-right ml-4 max-w-[60%] break-words">
                                                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setEnrichmentResult(null);
                                        setIsOpen(false);
                                    }}
                                >
                                    Отмена
                                </Button>
                                {enrichmentResult.metadata.success && (
                                    <Button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                    >
                                        {isSaving ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Сохранение...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                Применить изменения
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
