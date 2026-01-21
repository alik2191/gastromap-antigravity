import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { handleError } from '@/lib/errorHandler';
import * as XLSX from 'xlsx';

/**
 * Custom hook for import/export functionality
 * Extracted from Admin.jsx for better organization
 */
export function useImportExport(locations = []) {
    const [isImporting, setIsImporting] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    /**
     * Export locations to CSV
     */
    const exportToCSV = useCallback(() => {
        try {
            setIsExporting(true);

            if (!locations || locations.length === 0) {
                toast.warning('Нет данных для экспорта');
                return;
            }

            // Prepare CSV data
            const headers = [
                'name',
                'type',
                'country',
                'city',
                'address',
                'description',
                'insider_tip',
                'must_try',
                'price_range',
                'website',
                'phone',
                'opening_hours',
                'latitude',
                'longitude',
                'tags',
                'status',
            ];

            const csvContent = [
                headers.join(','),
                ...locations.map((loc) =>
                    headers
                        .map((header) => {
                            let value = loc[header] || '';
                            // Handle arrays
                            if (Array.isArray(value)) {
                                value = value.join(';');
                            }
                            // Escape quotes and wrap in quotes if contains comma
                            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                                value = `"${value.replace(/"/g, '""')}"`;
                            }
                            return value;
                        })
                        .join(',')
                ),
            ].join('\n');

            // Create and download file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `gastromap_locations_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success(`Экспортировано ${locations.length} локаций`);
        } catch (error) {
            handleError(error, { context: 'Экспорт в CSV' });
        } finally {
            setIsExporting(false);
        }
    }, [locations]);

    /**
     * Export locations to Excel
     */
    const exportToExcel = useCallback(() => {
        try {
            setIsExporting(true);

            if (!locations || locations.length === 0) {
                toast.warning('Нет данных для экспорта');
                return;
            }

            // Prepare data for Excel
            const data = locations.map((loc) => ({
                Name: loc.name,
                Type: loc.type,
                Country: loc.country,
                City: loc.city,
                Address: loc.address,
                Description: loc.description,
                'Insider Tip': loc.insider_tip,
                'Must Try': loc.must_try,
                'Price Range': loc.price_range,
                Website: loc.website,
                Phone: loc.phone,
                'Opening Hours': loc.opening_hours,
                Latitude: loc.latitude,
                Longitude: loc.longitude,
                Tags: Array.isArray(loc.tags) ? loc.tags.join('; ') : loc.tags,
                Status: loc.status,
            }));

            // Create workbook and worksheet
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(data);

            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(wb, ws, 'Locations');

            // Generate Excel file and download
            XLSX.writeFile(wb, `gastromap_locations_${new Date().toISOString().split('T')[0]}.xlsx`);

            toast.success(`Экспортировано ${locations.length} локаций`);
        } catch (error) {
            handleError(error, { context: 'Экспорт в Excel' });
        } finally {
            setIsExporting(false);
        }
    }, [locations]);

    /**
     * Import locations from CSV
     */
    const importFromCSV = useCallback((file, onSuccess) => {
        return new Promise((resolve, reject) => {
            try {
                setIsImporting(true);

                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const text = e.target.result;
                        const lines = text.split('\n');
                        const headers = lines[0].split(',').map((h) => h.trim());

                        const locations = [];
                        for (let i = 1; i < lines.length; i++) {
                            if (!lines[i].trim()) continue;

                            const values = lines[i].split(',');
                            const location = {};

                            headers.forEach((header, index) => {
                                let value = values[index]?.trim() || '';
                                // Remove quotes
                                if (value.startsWith('"') && value.endsWith('"')) {
                                    value = value.slice(1, -1).replace(/""/g, '"');
                                }
                                // Handle arrays
                                if (header === 'tags' && value) {
                                    value = value.split(';').map((t) => t.trim());
                                }
                                location[header] = value;
                            });

                            locations.push(location);
                        }

                        if (onSuccess) {
                            onSuccess(locations);
                        }

                        toast.success(`Импортировано ${locations.length} локаций`);
                        resolve(locations);
                    } catch (error) {
                        handleError(error, { context: 'Парсинг CSV файла' });
                        reject(error);
                    } finally {
                        setIsImporting(false);
                    }
                };

                reader.onerror = (error) => {
                    handleError(error, { context: 'Чтение CSV файла' });
                    setIsImporting(false);
                    reject(error);
                };

                reader.readAsText(file);
            } catch (error) {
                handleError(error, { context: 'Импорт из CSV' });
                setIsImporting(false);
                reject(error);
            }
        });
    }, []);

    /**
     * Import locations from Excel
     */
    const importFromExcel = useCallback((file, onSuccess) => {
        return new Promise((resolve, reject) => {
            try {
                setIsImporting(true);

                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = new Uint8Array(e.target.result);
                        const workbook = XLSX.read(data, { type: 'array' });
                        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

                        // Convert to expected format
                        const locations = jsonData.map((row) => ({
                            name: row.Name,
                            type: row.Type,
                            country: row.Country,
                            city: row.City,
                            address: row.Address,
                            description: row.Description,
                            insider_tip: row['Insider Tip'],
                            must_try: row['Must Try'],
                            price_range: row['Price Range'],
                            website: row.Website,
                            phone: row.Phone,
                            opening_hours: row['Opening Hours'],
                            latitude: row.Latitude,
                            longitude: row.Longitude,
                            tags: row.Tags ? row.Tags.split(';').map((t) => t.trim()) : [],
                            status: row.Status || 'pending',
                        }));

                        if (onSuccess) {
                            onSuccess(locations);
                        }

                        toast.success(`Импортировано ${locations.length} локаций`);
                        resolve(locations);
                    } catch (error) {
                        handleError(error, { context: 'Парсинг Excel файла' });
                        reject(error);
                    } finally {
                        setIsImporting(false);
                    }
                };

                reader.onerror = (error) => {
                    handleError(error, { context: 'Чтение Excel файла' });
                    setIsImporting(false);
                    reject(error);
                };

                reader.readAsArrayBuffer(file);
            } catch (error) {
                handleError(error, { context: 'Импорт из Excel' });
                setIsImporting(false);
                reject(error);
            }
        });
    }, []);

    return {
        isImporting,
        isExporting,
        exportToCSV,
        exportToExcel,
        importFromCSV,
        importFromExcel,
    };
}

export default useImportExport;
