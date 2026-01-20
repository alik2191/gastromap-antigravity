import React, { useState, useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle, Download, Filter } from "lucide-react";
import * as XLSX from 'xlsx';

/**
 * ImportReport Component
 * Displays detailed import results with filtering and export capabilities
 */
export default function ImportReport({ open, onClose, results }) {
    const [showOnlyErrors, setShowOnlyErrors] = useState(false);

    // Calculate statistics
    const stats = useMemo(() => {
        if (!results || !results.details) return { total: 0, success: 0, errors: 0, duplicates: 0 };

        const total = results.details.length;
        const success = results.details.filter(r => r.status === 'success').length;
        const errors = results.details.filter(r => r.status === 'error').length;
        const duplicates = results.details.filter(r => r.status === 'duplicate').length;

        return { total, success, errors, duplicates };
    }, [results]);

    // Filter results
    const filteredResults = useMemo(() => {
        if (!results || !results.details) return [];

        if (showOnlyErrors) {
            return results.details.filter(r => r.status === 'error' || r.status === 'duplicate');
        }

        return results.details;
    }, [results, showOnlyErrors]);

    // Export errors to Excel
    const handleExportErrors = () => {
        const errorRows = results.details.filter(r => r.status === 'error' || r.status === 'duplicate');

        if (errorRows.length === 0) {
            return;
        }

        const exportData = errorRows.map(row => ({
            'Строка': row.rowNumber,
            'Название': row.name || '',
            'Город': row.city || '',
            'Адрес': row.address || '',
            'Статус': row.status === 'duplicate' ? 'Дубликат' : 'Ошибка',
            'Описание ошибки': row.error || ''
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Ошибки импорта');

        const fileName = `import_errors_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
    };

    if (!results) return null;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Отчет об импорте</DialogTitle>
                    <DialogDescription>
                        Детальные результаты импорта локаций
                    </DialogDescription>
                </DialogHeader>

                {/* Statistics */}
                <div className="grid grid-cols-4 gap-4 py-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                        <div className="text-sm text-gray-600">Всего строк</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{stats.success}</div>
                        <div className="text-sm text-gray-600">Успешно</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">{stats.duplicates}</div>
                        <div className="text-sm text-gray-600">Дубликаты</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">{stats.errors}</div>
                        <div className="text-sm text-gray-600">Ошибки</div>
                    </div>
                </div>

                {/* Filters and Actions */}
                <div className="flex items-center justify-between py-2 border-t border-b">
                    <Button
                        variant={showOnlyErrors ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowOnlyErrors(!showOnlyErrors)}
                    >
                        <Filter className="w-4 h-4 mr-2" />
                        {showOnlyErrors ? 'Показать все' : 'Только ошибки'}
                    </Button>

                    {(stats.errors > 0 || stats.duplicates > 0) && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExportErrors}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Экспорт ошибок в Excel
                        </Button>
                    )}
                </div>

                {/* Results Table */}
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-white border-b">
                            <tr>
                                <th className="text-left p-2 font-medium">Строка</th>
                                <th className="text-left p-2 font-medium">Название</th>
                                <th className="text-left p-2 font-medium">Город</th>
                                <th className="text-left p-2 font-medium">Статус</th>
                                <th className="text-left p-2 font-medium">Детали</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredResults.map((row, idx) => (
                                <tr key={idx} className="border-b hover:bg-gray-50">
                                    <td className="p-2">{row.rowNumber}</td>
                                    <td className="p-2 font-medium">{row.name || '-'}</td>
                                    <td className="p-2">{row.city || '-'}</td>
                                    <td className="p-2">
                                        {row.status === 'success' && (
                                            <Badge variant="success" className="bg-green-100 text-green-800">
                                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                                Успешно
                                            </Badge>
                                        )}
                                        {row.status === 'duplicate' && (
                                            <Badge variant="warning" className="bg-yellow-100 text-yellow-800">
                                                <AlertCircle className="w-3 h-3 mr-1" />
                                                Дубликат
                                            </Badge>
                                        )}
                                        {row.status === 'error' && (
                                            <Badge variant="destructive" className="bg-red-100 text-red-800">
                                                <XCircle className="w-3 h-3 mr-1" />
                                                Ошибка
                                            </Badge>
                                        )}
                                    </td>
                                    <td className="p-2 text-gray-600 text-xs">
                                        {row.error || (row.status === 'success' ? 'Импортировано успешно' : '-')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredResults.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            Нет результатов для отображения
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end pt-4 border-t">
                    <Button onClick={onClose}>
                        Закрыть
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
