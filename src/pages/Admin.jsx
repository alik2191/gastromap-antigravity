import React, { useState, useEffect, useRef } from 'react';
// import { base44 } from '@/api/client'; // DISABLED: Using mock client
import { base44 } from '@/api/client'; // MOCK DATA
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    MapPin, Users, CreditCard, Plus, Pencil, Trash2,
    Loader2, ArrowLeft, Search, Star, Globe, TrendingUp, AlertCircle,
    Sparkles, Wand2, MessageSquare, CheckCircle2, Archive, Copy,
    FileSpreadsheet, Download, Upload, MoreVertical,
    ChevronLeft, ChevronRight, X, BarChart3, Eye, EyeOff
} from "lucide-react";
import * as XLSX from 'xlsx';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationPicker({ position, onLocationSelect }) {
    useMapEvents({
        click(e) {
            onLocationSelect(e.latlng);
        },
    });

    return position ? <Marker position={position} /> : null;
}
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import AnalyticsTab from '../components/admin/AnalyticsTab';
import ImportWizard from '../components/admin/ImportWizard';
import BulkEditor from '../components/admin/BulkEditor';
import ReviewDetail from '../components/admin/ReviewDetail';
import CreatorModerationTab from '../components/admin/CreatorModerationTab';
import ModerationLocationsTab from '../components/admin/ModerationLocationsTab';
import AIManagementTab from '../components/admin/AIManagementTab';
import CreatorLocationEditForm from '../components/dashboard/CreatorLocationEditForm';

export default function Admin() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('locations');
    const [showLocationForm, setShowLocationForm] = useState(false);
    const [editingLocation, setEditingLocation] = useState(null);
    const [showSubscriptionForm, setShowSubscriptionForm] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCountry, setFilterCountry] = useState('all');
    const [filterCity, setFilterCity] = useState('all');
    const [filterPrice, setFilterPrice] = useState('all');
    const [sortBy, setSortBy] = useState('updated_date'); // updated_date or created_date
    const [selectedFeedback, setSelectedFeedback] = useState(null);
    const [showFeedbackDetail, setShowFeedbackDetail] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [showImportErrors, setShowImportErrors] = useState(false);
    const [importErrors, setImportErrors] = useState([]);
    const [lastImportChanges, setLastImportChanges] = useState(null);
    const [showImportWizard, setShowImportWizard] = useState(false);
    const [importFile, setImportFile] = useState(null);
    const [importType, setImportType] = useState('csv');
    const [showBulkImport, setShowBulkImport] = useState(false);
    const [bulkImportText, setBulkImportText] = useState('');
    const [bulkImportCountry, setBulkImportCountry] = useState('');
    const [bulkImportCity, setBulkImportCity] = useState('');
    const [isBulkImporting, setIsBulkImporting] = useState(false);
    const [showBulkEditor, setShowBulkEditor] = useState(false);
    const [selectedReview, setSelectedReview] = useState(null);
    const [showReviewDetail, setShowReviewDetail] = useState(false);
    const [editingLocationId, setEditingLocationId] = useState(null);
    const [showEditForm, setShowEditForm] = useState(false);

    // Hierarchical Navigation State
    const [browsingLevel, setBrowsingLevel] = useState('countries'); // countries -> cities -> locations
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [selectedCity, setSelectedCity] = useState(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(40);

    const queryClient = useQueryClient();

    useEffect(() => {
        const handleResize = () => {
            setItemsPerPage(window.innerWidth < 768 ? 20 : 40);
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleExport = () => {
        if (!locations.length) {
            toast.error('Нет данных для экспорта');
            return;
        }

        // Define headers
        const headers = [
            'id', 'name', 'type', 'country', 'city', 'address',
            'description', 'price_range', 'website', 'image_url',
            'latitude', 'longitude', 'is_hidden_gem', 'is_featured',
            'insider_tip', 'must_try'
        ];

        // Convert to CSV
        const csvContent = [
            headers.join(','),
            ...locations.map(loc => headers.map(header => {
                let value = loc[header] === null || loc[header] === undefined ? '' : loc[header];
                // Escape quotes and wrap in quotes if contains comma or quotes
                const stringValue = String(value);
                if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                    return `"${stringValue.replace(/"/g, '""')}"`;
                }
                return stringValue;
            }).join(','))
        ].join('\n');

        // Download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `locations_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportExcel = () => {
        if (!locations.length) {
            toast.error('Нет данных для экспорта');
            return;
        }
        const headers = [
            'id', 'name', 'type', 'country', 'city', 'address',
            'description', 'price_range', 'website', 'image_url',
            'latitude', 'longitude', 'is_hidden_gem', 'is_featured',
            'insider_tip', 'must_try'
        ];
        const data = locations.map(loc => {
            const row = {};
            headers.forEach(h => { row[h] = loc[h] ?? ''; });
            return row;
        });
        const ws = XLSX.utils.json_to_sheet(data, { header: headers });
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Locations');
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `locations_export_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImport = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const text = e.target.result;
                const rows = text.split('\n');
                const headers = rows[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

                const data = [];
                for (let i = 1; i < rows.length; i++) {
                    const row = rows[i].trim();
                    if (!row) continue;

                    // Simple CSV parser that handles quotes
                    const values = [];
                    let current = '';
                    let inQuotes = false;

                    for (let char of row) {
                        if (char === '"') {
                            if (inQuotes && current.slice(-1) === '"') {
                                // Escaped quote
                                current = current.slice(0, -1) + '"';
                            } else {
                                inQuotes = !inQuotes;
                            }
                        } else if (char === ',' && !inQuotes) {
                            values.push(current);
                            current = '';
                        } else {
                            current += char;
                        }
                    }
                    values.push(current);

                    const obj = {};
                    headers.forEach((header, index) => {
                        let value = values[index]?.trim().replace(/^"|"$/g, '').replace(/""/g, '"');

                        // Type conversion
                        if (header === 'latitude' || header === 'longitude') {
                            value = value ? parseFloat(value) : null;
                        } else if (header === 'is_hidden_gem' || header === 'is_featured') {
                            value = value === 'true' || value === '1';
                        }

                        if (value !== undefined) {
                            obj[header] = value;
                        }
                    });

                    data.push({ ...obj, sourceRow: i + 1 }); // Save row for error details
                }

                if (data.length === 0) {
                    toast.error('Файл пуст или имеет неверный формат');
                    setIsImporting(false);
                    return;
                }

                // Send to backend
                const response = await base44.functions.invoke('importLocations', { locations: data });

                if (response.data.error) {
                    throw new Error(response.data.error);
                }

                const { created, updated, errors, errorDetails, createdIds = [], updatedChanges = [] } = response.data;
                toast.success(`Импорт завершен: Создано ${created}, Обновлено ${updated}, Ошибок ${errors}`);
                setLastImportChanges({ createdIds, updatedChanges });
                if (errors > 0 && Array.isArray(errorDetails) && errorDetails.length > 0) {
                    setImportErrors(errorDetails);
                    setShowImportErrors(true);
                }
                queryClient.invalidateQueries(['admin-locations']);

            } catch (error) {
                console.error(error);
                toast.error('Ошибка импорта: ' + error.message);
            } finally {
                setIsImporting(false);
                event.target.value = ''; // Reset input
            }
        };

        reader.readAsText(file);
    };

    const handleImportExcel = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setIsImporting(true);
        try {
            const arrayBuffer = await file.arrayBuffer();
            const wb = XLSX.read(arrayBuffer, { type: 'array' });
            const wsName = wb.SheetNames[0];
            const ws = wb.Sheets[wsName];
            const json = XLSX.utils.sheet_to_json(ws, { defval: '' });
            const headers = ['id', 'name', 'type', 'country', 'city', 'address', 'description', 'price_range', 'website', 'image_url', 'latitude', 'longitude', 'is_hidden_gem', 'is_featured', 'insider_tip', 'must_try'];
            const data = json.map((row, idx) => {
                const obj = {};
                headers.forEach(h => {
                    let value = row[h];
                    if (h === 'latitude' || h === 'longitude') {
                        value = value === '' || value === null || value === undefined ? null : parseFloat(value);
                    } else if (h === 'is_hidden_gem' || h === 'is_featured') {
                        value = value === true || value === 'true' || value === 1 || value === '1';
                    }
                    if (value !== undefined) obj[h] = value;
                });
                return { ...obj, sourceRow: idx + 2 }; // +2 for header row offset
            });

            if (data.length === 0) {
                toast.error('Файл пуст или имеет неверный формат');
                setIsImporting(false);
                return;
            }

            const response = await base44.functions.invoke('importLocations', { locations: data });
            if (response.data.error) {
                throw new Error(response.data.error);
            }
            const { created, updated, errors, errorDetails, createdIds = [], updatedChanges = [] } = response.data;
            toast.success(`Импорт завершен: Создано ${created}, Обновлено ${updated}, Ошибок ${errors}`);
            setLastImportChanges({ createdIds, updatedChanges });
            if (errors > 0 && Array.isArray(errorDetails) && errorDetails.length > 0) {
                setImportErrors(errorDetails);
                setShowImportErrors(true);
            }
            queryClient.invalidateQueries(['admin-locations']);
        } catch (error) {
            console.error(error);
            toast.error('Ошибка импорта: ' + error.message);
        } finally {
            setIsImporting(false);
            event.target.value = '';
        }
    };

    const handleBulkImport = async () => {
        if (!bulkImportCountry.trim() || !bulkImportCity.trim()) {
            toast.error('Укажите страну и город');
            return;
        }

        if (!bulkImportText.trim()) {
            toast.error('Введите список локаций');
            return;
        }

        setIsBulkImporting(true);
        try {
            const locations = bulkImportText
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0);

            if (locations.length === 0) {
                toast.error('Список пуст');
                setIsBulkImporting(false);
                return;
            }

            toast.info(`Обрабатываю ${locations.length} локаций... Это может занять несколько минут.`);

            const response = await base44.functions.invoke('bulkImportLocations', {
                locations,
                country: bulkImportCountry,
                city: bulkImportCity
            });

            if (response.data.error) {
                throw new Error(response.data.error);
            }

            const { success, failed } = response.data;

            if (success > 0) {
                toast.success(`Успешно добавлено ${success} локаций на модерацию!`);
                queryClient.invalidateQueries(['admin-pending-locations']);
            }

            if (failed > 0) {
                toast.warning(`Не удалось обработать ${failed} локаций`);
            }

            setShowBulkImport(false);
            setBulkImportText('');
            setBulkImportCountry('');
            setBulkImportCity('');
        } catch (error) {
            console.error(error);
            toast.error('Ошибка импорта: ' + error.message);
        } finally {
            setIsBulkImporting(false);
        }
    };

    const checkAdmin = async () => {
        // DEMO MODE: Skip auth check and use mock admin user
        setUser({
            id: 'demo-user-123',
            email: 'demo@gastromap.app',
            name: 'Demo User',
            role: 'admin'
        });
        setLoading(false);

        /* Original auth code:
        try {
            const userData = await base44.auth.me();
            if (userData.role !== 'admin') {
                navigate(createPageUrl('Dashboard'));
                return;
            }
            setUser(userData);
        } catch (e) {
            base44.auth.redirectToLogin(window.location.href);
            return;
        }
        setLoading(false);
        */
    };

    useEffect(() => {
        checkAdmin();
    }, []);

    const { data: locations = [] } = useQuery({
        queryKey: ['admin-locations'],
        queryFn: async () => {
            const allLocations = await base44.entities.Location.list();
            return allLocations.filter(l => l.status === 'published' || !l.status);
        },
        enabled: !loading
    });

    const { data: pendingLocations = [] } = useQuery({
        queryKey: ['admin-pending-locations'],
        queryFn: async () => {
            const allLocations = await base44.entities.Location.list('-created_date');
            return allLocations.filter(l => l.status === 'pending');
        },
        enabled: !loading
    });

    const { data: subscriptions = [] } = useQuery({
        queryKey: ['admin-subscriptions'],
        queryFn: () => base44.entities.Subscription.list('-created_date'),
        enabled: !loading,
        refetchInterval: 60000 // Poll every minute
    });

    const { data: users = [] } = useQuery({
        queryKey: ['admin-users'],
        queryFn: () => base44.entities.User.list(),
        enabled: !loading
    });

    const { data: feedback = [] } = useQuery({
        queryKey: ['admin-feedback'],
        queryFn: () => base44.entities.Feedback.list('-created_date'),
        enabled: !loading,
        refetchInterval: 30000 // Poll every 30 seconds
    });

    const { data: regionStatuses = [] } = useQuery({
        queryKey: ['admin-region-statuses'],
        queryFn: () => base44.entities.RegionStatus.list(),
        enabled: !loading
    });

    const { data: reviews = [] } = useQuery({
        queryKey: ['admin-reviews'],
        queryFn: () => base44.entities.Review.list('-created_date'),
        enabled: !loading,
        refetchInterval: 30000
    });

    const { data: agentConversations = [] } = useQuery({
        queryKey: ['agent-conversations'],
        queryFn: () => base44.agents.listConversations({ agent_name: 'location_manager' }),
        enabled: !loading
    });

    const { data: moderationRounds = [] } = useQuery({
        queryKey: ['admin-moderation-rounds'],
        queryFn: async () => {
            const allRounds = await base44.entities.ModerationRound.filter({ status: 'pending_admin_review' });
            // Only AI-generated rounds (not creator voting rounds)
            return allRounds.filter(round =>
                (round.yes_count === 0 || !round.yes_count) &&
                (round.no_count === 0 || !round.no_count)
            );
        },
        enabled: !loading,
        refetchInterval: 30000
    });

    const isAgentConnected = agentConversations.length > 0;

    const newFeedbackCount = feedback.filter(item => item.status === 'new').length;
    const newReviewsCount = reviews.filter(item => item.status === 'pending').length;
    const newModerationRoundsCount = moderationRounds.length;

    // Notification Logic
    const prevFeedbackCountRef = useRef(null);
    const prevReviewsCountRef = useRef(null);
    const notifiedExpiredIds = useRef(new Set());

    // 1. New Feedback Notification
    useEffect(() => {
        if (loading) return;

        // Initialize ref on first load
        if (prevFeedbackCountRef.current === null) {
            prevFeedbackCountRef.current = newFeedbackCount;
            return;
        }

        if (newFeedbackCount > prevFeedbackCountRef.current) {
            const diff = newFeedbackCount - prevFeedbackCountRef.current;
            toast.info(`Получено ${diff} новы(х) обращени(я)!`, {
                action: {
                    label: 'Просмотреть',
                    onClick: () => setActiveTab("feedback")
                },
                duration: 5000
            });
        }
        prevFeedbackCountRef.current = newFeedbackCount;
    }, [newFeedbackCount, loading]);

    // 2. New Reviews Notification
    useEffect(() => {
        if (loading) return;

        if (prevReviewsCountRef.current === null) {
            prevReviewsCountRef.current = newReviewsCount;
            return;
        }

        if (newReviewsCount > prevReviewsCountRef.current) {
            const diff = newReviewsCount - prevReviewsCountRef.current;
            toast.info(`Получено ${diff} новы(х) отзыва(ов) на модерацию!`, {
                action: {
                    label: 'Просмотреть',
                    onClick: () => setActiveTab("reviews")
                },
                duration: 5000
            });
        }
        prevReviewsCountRef.current = newReviewsCount;
    }, [newReviewsCount, loading]);

    // 3. Subscription Expiration Notification and Auto-update
    useEffect(() => {
        if (loading) return;

        const now = new Date();
        const expiredActive = subscriptions.filter(s =>
            s.status === 'active' && new Date(s.end_date) < now
        );

        let hasNewExpired = false;
        expiredActive.forEach(sub => {
            if (!notifiedExpiredIds.current.has(sub.id)) {
                hasNewExpired = true;
                notifiedExpiredIds.current.add(sub.id);
                // Auto-update status
                base44.entities.Subscription.update(sub.id, { status: 'expired' }).catch(console.error);
            }
        });

        if (hasNewExpired) {
            toast.warning(`Внимание: Обнаружено ${expiredActive.length} подписок с истекшим сроком! Статус обновлён.`, {
                action: {
                    label: 'Проверить',
                    onClick: () => setActiveTab("subscriptions")
                },
                duration: 8000
            });
            // Refresh subscriptions after auto-update
            setTimeout(() => {
                queryClient.invalidateQueries(['admin-subscriptions']);
            }, 1000);
        }
    }, [subscriptions, loading, queryClient]);

    const locationMutation = useMutation({
        mutationFn: async (data) => {
            if (data.id) {
                return base44.entities.Location.update(data.id, data);
            }
            return base44.entities.Location.create(data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-locations']);
            queryClient.invalidateQueries(['admin-pending-locations']);
            setShowLocationForm(false);
            setEditingLocation(null);
            toast.success('Локация сохранена');
        }
    });

    const publishLocationMutation = useMutation({
        mutationFn: async (id) => {
            return base44.entities.Location.update(id, { status: 'published' });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-locations']);
            queryClient.invalidateQueries(['admin-pending-locations']);
            setShowLocationForm(false);
            setEditingLocation(null);
            toast.success('Локация опубликована!');
        }
    });

    const rejectLocationMutation = useMutation({
        mutationFn: async (id) => {
            return base44.entities.Location.update(id, { status: 'rejected' });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-locations']);
            queryClient.invalidateQueries(['admin-pending-locations']);
            toast.success('Локация отклонена');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => base44.entities.Location.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-locations']);
            toast.success('Локация удалена');
        }
    });

    const subscriptionMutation = useMutation({
        mutationFn: ({ id, status }) => base44.entities.Subscription.update(id, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-subscriptions']);
            toast.success('Статус обновлён');
        }
    });

    const feedbackMutation = useMutation({
        mutationFn: ({ id, status }) => base44.entities.Feedback.update(id, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-feedback']);
            toast.success('Статус обновлён');
        }
    });

    const reviewMutation = useMutation({
        mutationFn: ({ id, status, is_hidden }) => base44.entities.Review.update(id, { status, is_hidden }),
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-reviews']);
            queryClient.invalidateQueries(['analytics-reviews']);
            toast.success('Статус отзыва обновлён');
        }
    });

    const updateUserRoleMutation = useMutation({
        mutationFn: ({ id, custom_role }) => base44.entities.User.update(id, { custom_role }),
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-users']);
            toast.success('Роль обновлена');
        }
    });

    const updateRegionStatusMutation = useMutation({
        mutationFn: async ({ region_name, region_type, parent_region, is_active, is_coming_soon, image_url, image_url_day, image_url_evening, image_url_night }) => {
            const existing = regionStatuses.find(rs =>
                rs.region_name === region_name &&
                rs.region_type === region_type &&
                (region_type === 'city' ? rs.parent_region === parent_region : true)
            );
            const updateData = { is_active, is_coming_soon };
            if (image_url !== undefined) updateData.image_url = image_url;
            if (image_url_day !== undefined) updateData.image_url_day = image_url_day;
            if (image_url_evening !== undefined) updateData.image_url_evening = image_url_evening;
            if (image_url_night !== undefined) updateData.image_url_night = image_url_night;

            if (existing) {
                return base44.entities.RegionStatus.update(existing.id, updateData);
            }
            return base44.entities.RegionStatus.create({
                region_name,
                region_type,
                parent_region,
                ...updateData
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-region-statuses']);
            toast.success('Статус обновлён');
        }
    });

    const createSubscriptionMutation = useMutation({
        mutationFn: (data) => base44.entities.Subscription.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-subscriptions']);
            setShowSubscriptionForm(false);
            toast.success('Подписка создана');
        }
    });

    const activeSubscriptions = subscriptions.filter(s => s.status === 'active').length;
    const totalRevenue = subscriptions.reduce((sum, s) => sum + (s.amount_paid || 0), 0);

    // Helper to reset navigation
    const goHome = () => {
        setBrowsingLevel('countries');
        setSelectedCountry(null);
        setSelectedCity(null);
        setSearchQuery('');
        setFilterCountry('all');
        setFilterCity('all');
        setFilterPrice('all');
    };

    const selectCountry = (country) => {
        setSelectedCountry(country);
        setSelectedCity(null);
        setBrowsingLevel('cities');
        setFilterCity('all');
    };

    const selectCity = (city) => {
        setSelectedCity(city);
        setBrowsingLevel('locations');
    };

    // Data aggregation for hierarchy
    const availableCountries = [...new Set(locations.map(l => l.country))].filter(Boolean).sort();

    const countryData = availableCountries.map(country => {
        const locs = locations.filter(l => l.country === country);
        const regionStatus = regionStatuses.find(rs => rs.region_name === country && rs.region_type === 'country');
        return {
            name: country,
            count: locs.length,
            citiesCount: new Set(locs.map(l => l.city)).size,
            is_active: regionStatus ? regionStatus.is_active : true,
            is_coming_soon: regionStatus ? regionStatus.is_coming_soon : false,
            image_url: regionStatus?.image_url || null,
            image_url_day: regionStatus?.image_url_day || null,
            image_url_evening: regionStatus?.image_url_evening || null,
            image_url_night: regionStatus?.image_url_night || null
        };
    });

    const availableCities = selectedCountry
        ? [...new Set(locations.filter(l => l.country === selectedCountry).map(l => l.city))].filter(Boolean).sort()
        : [];

    const cityData = availableCities.map(city => {
        const locs = locations.filter(l => l.country === selectedCountry && l.city === city);
        const regionStatus = regionStatuses.find(rs =>
            rs.region_name === city &&
            rs.region_type === 'city' &&
            rs.parent_region === selectedCountry
        );
        return {
            name: city,
            count: locs.length,
            is_active: regionStatus ? regionStatus.is_active : true,
            is_coming_soon: regionStatus ? regionStatus.is_coming_soon : false,
            image_url: regionStatus?.image_url || null
        };
    });

    const filteredLocations = locations.filter(loc => {
        const matchesSearch =
            loc.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            loc.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            loc.country?.toLowerCase().includes(searchQuery.toLowerCase());

        // If searching, ignore hierarchy. If not searching, respect hierarchy.
        let matchesHierarchy = true;
        if (!searchQuery) {
            if (browsingLevel === 'locations') {
                matchesHierarchy = loc.country === selectedCountry && loc.city === selectedCity;
            } else if (browsingLevel === 'cities') {
                matchesHierarchy = loc.country === selectedCountry;
            }
        }

        const matchesCountry = filterCountry === 'all' || loc.country === filterCountry;
        const matchesCity = filterCity === 'all' || loc.city === filterCity;
        const matchesPrice = filterPrice === 'all' || loc.price_range === filterPrice;

        return matchesSearch && matchesHierarchy && matchesCountry && matchesCity && matchesPrice;
    }).sort((a, b) => {
        // Sort by date
        const dateA = new Date(a[sortBy] || 0);
        const dateB = new Date(b[sortBy] || 0);
        return dateB - dateA; // Newest first
    });

    // Pagination Logic
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterCountry, filterCity, filterPrice, sortBy, browsingLevel, selectedCountry, selectedCity]);

    const totalPages = Math.ceil(filteredLocations.length / itemsPerPage);
    const paginatedLocations = filteredLocations.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-stone-50 dark:bg-neutral-900 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-50 dark:bg-neutral-900">
            {/* Header */}
            <header className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link to={createPageUrl('Dashboard')}>
                                <Button variant="ghost" size="sm">
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back
                                </Button>
                            </Link>
                            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Admin Panel</h1>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-4">
                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
                    <Card className="border-l-2 border-l-amber-500 shadow-sm border-0 dark:bg-neutral-800 dark:border dark:border-neutral-700">
                        <CardContent className="p-2.5">
                            <div className="flex items-center justify-between gap-1.5">
                                <div>
                                    <p className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Локаций</p>
                                    <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">{locations.length}</p>
                                </div>
                                <div className="w-7 h-7 bg-amber-50 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                                    <MapPin className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-2 border-l-blue-500 shadow-sm border-0 dark:bg-neutral-800 dark:border dark:border-neutral-700">
                        <CardContent className="p-2.5">
                            <div className="flex items-center justify-between gap-1.5">
                                <div>
                                    <p className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Пользователей</p>
                                    <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">{users.length}</p>
                                </div>
                                <div className="w-7 h-7 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                    <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-2 border-l-green-500 shadow-sm border-0 dark:bg-neutral-800 dark:border dark:border-neutral-700">
                        <CardContent className="p-2.5">
                            <div className="flex items-center justify-between gap-1.5">
                                <div>
                                    <p className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Подписок</p>
                                    <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">{activeSubscriptions}</p>
                                </div>
                                <div className="w-7 h-7 bg-green-50 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                                    <CreditCard className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-2 border-l-purple-500 shadow-sm border-0 dark:bg-neutral-800 dark:border dark:border-neutral-700">
                        <CardContent className="p-2.5">
                            <div className="flex items-center justify-between gap-1.5">
                                <div>
                                    <p className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Доход</p>
                                    <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">${totalRevenue.toLocaleString()}</p>
                                </div>
                                <div className="w-7 h-7 bg-purple-50 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                                    <TrendingUp className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* WhatsApp Agent Card */}
                <Card className={`border-l-2 ${isAgentConnected ? 'border-l-green-500 bg-gradient-to-r from-green-50 to-white dark:from-green-950/20 dark:to-neutral-800' : 'border-l-gray-400 bg-gradient-to-r from-gray-50 to-white dark:from-neutral-900 dark:to-neutral-800'} dark:border-neutral-700`}>
                    <CardContent className="p-3 md:p-4">
                        {isAgentConnected ? (
                            <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
                                        <MessageSquare className="w-5 h-5 md:w-6 md:h-6 text-white" />
                                        <div className="absolute w-3 h-3 bg-green-400 rounded-full animate-ping" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-sm md:text-base text-green-900 dark:text-green-200 mb-0.5">AI Агент подключен</h3>
                                        <p className="text-xs md:text-sm text-green-700 dark:text-green-300">
                                            Управление локациями через WhatsApp активно
                                        </p>
                                    </div>
                                </div>
                                <Badge className="bg-green-600 text-white shrink-0 md:ml-auto">
                                    Работает
                                </Badge>
                            </div>
                        ) : (
                            <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4">
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-sm md:text-base text-neutral-900 dark:text-neutral-100 mb-1">AI Агент для управления локациями</h3>
                                    <p className="text-xs md:text-sm text-neutral-700 dark:text-neutral-400">
                                        Управляйте локациями через WhatsApp - добавляйте, редактируйте, получайте уведомления
                                    </p>
                                </div>
                                <a
                                    href={base44.agents.getWhatsAppConnectURL('location_manager')}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="shrink-0 w-full md:w-auto"
                                >
                                    <Button className="bg-green-600 hover:bg-green-700 text-white w-full md:w-auto">
                                        <MessageSquare className="w-4 h-4 mr-2" />
                                        Подключить
                                    </Button>
                                </a>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="bg-white dark:bg-neutral-800 p-0.5 rounded-2xl border border-0 shadow-sm dark:border dark:border-neutral-700 w-full grid grid-cols-2 md:grid-cols-5 gap-0.5 h-auto">
                        <TabsTrigger
                            value="analytics"
                            className="data-[state=active]:bg-neutral-900 dark:data-[state=active]:bg-neutral-100 data-[state=active]:text-white dark:data-[state=active]:text-neutral-900 text-neutral-900 dark:text-neutral-300 rounded-[14px] py-1.5 text-xs md:text-sm"
                        >
                            Аналитика
                        </TabsTrigger>
                        <TabsTrigger
                            value="locations"
                            className="data-[state=active]:bg-neutral-900 dark:data-[state=active]:bg-neutral-100 data-[state=active]:text-white dark:data-[state=active]:text-neutral-900 text-neutral-900 dark:text-neutral-300 rounded-[14px] py-1.5 text-xs md:text-sm"
                        >
                            Локации
                        </TabsTrigger>
                        <TabsTrigger
                            value="moderation"
                            className="data-[state=active]:bg-neutral-900 dark:data-[state=active]:bg-neutral-100 data-[state=active]:text-white dark:data-[state=active]:text-neutral-900 text-neutral-900 dark:text-neutral-300 rounded-[14px] py-1.5 text-xs md:text-sm"
                        >
                            Новые локации
                            {pendingLocations.length > 0 && (
                                <span className="ml-1.5 bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                    {pendingLocations.length}
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger
                            value="creator-moderation"
                            className="data-[state=active]:bg-neutral-900 dark:data-[state=active]:bg-neutral-100 data-[state=active]:text-white dark:data-[state=active]:text-neutral-900 text-neutral-900 dark:text-neutral-300 rounded-[14px] py-1.5 text-xs md:text-sm"
                        >
                            Модерация
                            {newModerationRoundsCount > 0 && (
                                <span className="ml-1.5 bg-purple-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                    {newModerationRoundsCount}
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger
                            value="reviews"
                            className="data-[state=active]:bg-neutral-900 dark:data-[state=active]:bg-neutral-100 data-[state=active]:text-white dark:data-[state=active]:text-neutral-900 text-neutral-900 dark:text-neutral-300 rounded-[14px] py-1.5 text-xs md:text-sm"
                        >
                            Отзывы
                            {newReviewsCount > 0 && (
                                <span className="ml-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                    {newReviewsCount}
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger
                            value="subscriptions"
                            className="data-[state=active]:bg-neutral-900 dark:data-[state=active]:bg-neutral-100 data-[state=active]:text-white dark:data-[state=active]:text-neutral-900 text-neutral-900 dark:text-neutral-300 rounded-[14px] py-1.5 text-xs md:text-sm"
                        >
                            Подписки
                        </TabsTrigger>
                        <TabsTrigger
                            value="users"
                            className="data-[state=active]:bg-neutral-900 dark:data-[state=active]:bg-neutral-100 data-[state=active]:text-white dark:data-[state=active]:text-neutral-900 text-neutral-900 dark:text-neutral-300 rounded-[14px] py-1.5 text-xs md:text-sm"
                        >
                            Пользователи
                        </TabsTrigger>
                        <TabsTrigger
                            value="feedback"
                            className="data-[state=active]:bg-neutral-900 dark:data-[state=active]:bg-neutral-100 data-[state=active]:text-white dark:data-[state=active]:text-neutral-900 text-neutral-900 dark:text-neutral-300 rounded-[14px] py-1.5 text-xs md:text-sm"
                        >
                            Обратная связь
                            {newFeedbackCount > 0 && (
                                <span className="ml-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                    {newFeedbackCount}
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger
                            value="ai-management"
                            className="data-[state=active]:bg-neutral-900 dark:data-[state=active]:bg-neutral-100 data-[state=active]:text-white dark:data-[state=active]:text-neutral-900 text-neutral-900 dark:text-neutral-300 rounded-[14px] py-1.5 text-xs md:text-sm"
                        >
                            Управление AI
                            {newModerationRoundsCount > 0 && (
                                <span className="ml-1.5 bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                    {newModerationRoundsCount}
                                </span>
                            )}
                        </TabsTrigger>
                    </TabsList>


                    {/* Analytics Tab */}
                    <TabsContent value="analytics">
                        <AnalyticsTab />
                    </TabsContent>

                    {/* Locations Tab */}
                    <TabsContent value="locations">
                        <div className="mb-6 flex flex-col md:flex-row justify-end gap-3">
                            {/* Import/Export Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-full md:w-auto" disabled={isImporting}>
                                        {isImporting ? (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                            <FileSpreadsheet className="w-4 h-4 mr-2" />
                                        )}
                                        Операции с файлами
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={handleExport}>
                                        <Download className="w-4 h-4 mr-2" />
                                        Экспорт CSV
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => document.getElementById('csv-upload').click()}>
                                        <Upload className="w-4 h-4 mr-2" />
                                        Импорт CSV
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleExportExcel}>
                                        <Download className="w-4 h-4 mr-2" />
                                        Экспорт Excel
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setShowBulkEditor(true)}>
                                        <Pencil className="w-4 h-4 mr-2" />
                                        Массовое редактирование
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => document.getElementById('excel-upload').click()}>
                                        <Upload className="w-4 h-4 mr-2" />
                                        Импорт Excel
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <input
                                id="csv-upload"
                                type="file"
                                accept=".csv"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    setImportFile(file);
                                    setImportType('csv');
                                    setShowImportWizard(true);
                                    e.target.value = '';
                                }}
                            />
                            <input
                                id="excel-upload"
                                type="file"
                                accept=".xlsx,.xls"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    setImportFile(file);
                                    setImportType('excel');
                                    setShowImportWizard(true);
                                    e.target.value = '';
                                }}
                            />

                            <Dialog open={showBulkImport} onOpenChange={setShowBulkImport}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="w-full md:w-auto border-purple-200 text-purple-700 hover:bg-purple-50">
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        Импорт списка AI
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto dark:bg-neutral-800 dark:border-neutral-700">
                                    <DialogHeader>
                                        <DialogTitle className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
                                            <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                            Импорт множества локаций через AI
                                        </DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                        <div className="bg-purple-50 dark:bg-purple-950/30 border-0 shadow-sm dark:border dark:border-purple-900 rounded-lg p-4">
                                            <p className="text-sm text-neutral-900 dark:text-purple-200">
                                                Укажите страну и город, затем введите список названий заведений (по одному на строку).
                                                AI найдет информацию о каждом месте и создаст черновики для модерации.
                                            </p>
                                            <p className="text-xs text-neutral-700 dark:text-purple-400 mt-2">
                                                Например: "Café de Flore" или "Roscioli"
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div>
                                                <Label className="text-neutral-900 dark:text-neutral-300">Страна *</Label>
                                                <Input
                                                    placeholder="Например: France"
                                                    value={bulkImportCountry}
                                                    onChange={(e) => setBulkImportCountry(e.target.value)}
                                                    className="text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700 dark:placeholder:text-neutral-500"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-neutral-900 dark:text-neutral-300">Город *</Label>
                                                <Input
                                                    placeholder="Например: Paris"
                                                    value={bulkImportCity}
                                                    onChange={(e) => setBulkImportCity(e.target.value)}
                                                    className="text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700 dark:placeholder:text-neutral-500"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <Label className="text-neutral-900 dark:text-neutral-300">Список локаций</Label>
                                            <Textarea
                                                placeholder="Café de Flore&#10;Roscioli&#10;El Xampanyet&#10;..."
                                                value={bulkImportText}
                                                onChange={(e) => setBulkImportText(e.target.value)}
                                                rows={10}
                                                className="font-mono text-sm resize-none text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700 dark:placeholder:text-neutral-500"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={handleBulkImport}
                                                disabled={isBulkImporting || !bulkImportText.trim() || !bulkImportCountry.trim() || !bulkImportCity.trim()}
                                                className="flex-1 bg-purple-600 hover:bg-purple-700"
                                            >
                                                {isBulkImporting ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                        Обрабатываю...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Wand2 className="w-4 h-4 mr-2" />
                                                        Импортировать
                                                    </>
                                                )}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    setShowBulkImport(false);
                                                    setBulkImportText('');
                                                    setBulkImportCountry('');
                                                    setBulkImportCity('');
                                                }}
                                                disabled={isBulkImporting}
                                            >
                                                Отмена
                                            </Button>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>

                            <Dialog open={showLocationForm} onOpenChange={setShowLocationForm}>
                                <DialogTrigger asChild>
                                    <Button onClick={() => setEditingLocation(null)} className="w-full md:w-auto bg-stone-900 text-white hover:bg-stone-800">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Добавить локацию
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto dark:bg-neutral-800 dark:border-neutral-700">
                                    <DialogHeader>
                                        <DialogTitle className="text-neutral-900 dark:text-neutral-100">
                                            {editingLocation ? 'Редактировать' : 'Добавить'} локацию
                                        </DialogTitle>
                                    </DialogHeader>
                                    <LocationForm
                                        location={editingLocation}
                                        onSubmit={(data) => locationMutation.mutate(data)}
                                        isLoading={locationMutation.isPending}
                                    />
                                </DialogContent>
                            </Dialog>
                        </div>

                        {/* Undo import banner */}
                        {lastImportChanges && (lastImportChanges.createdIds?.length || lastImportChanges.updatedChanges?.length) ? (
                            <div className="mb-4 p-3 rounded-xl border-0 shadow-sm dark:border dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 flex items-center justify-between gap-3">
                                <div className="text-sm text-neutral-900 dark:text-amber-200">
                                    Последний импорт: создано {lastImportChanges.createdIds?.length || 0}, обновлено {lastImportChanges.updatedChanges?.length || 0}
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        className="border-amber-300 text-amber-900 hover:bg-amber-100"
                                        onClick={async () => {
                                            try {
                                                const payload = {
                                                    createdIds: lastImportChanges.createdIds || [],
                                                    updatedChanges: lastImportChanges.updatedChanges || []
                                                };
                                                const res = await base44.functions.invoke('rollbackImport', payload);
                                                if (res.data?.error) throw new Error(res.data.error);
                                                toast.success(`Откат выполнен: удалено ${res.data.deleted}, восстановлено ${res.data.restored}`);
                                                setLastImportChanges(null);
                                                queryClient.invalidateQueries(['admin-locations']);
                                                queryClient.invalidateQueries(['admin-pending-locations']);
                                            } catch (e) {
                                                toast.error('Ошибка отката: ' + e.message);
                                            }
                                        }}
                                    >
                                        Отменить импорт
                                    </Button>
                                    <Button variant="ghost" onClick={() => setLastImportChanges(null)}>Скрыть</Button>
                                </div>
                            </div>
                        ) : null}

                        {/* Import Wizard */}
                        {showImportWizard && (
                            <ImportWizard
                                isOpen={showImportWizard}
                                file={importFile}
                                type={importType}
                                onClose={() => { setShowImportWizard(false); setImportFile(null); }}
                                onImported={(summary) => {
                                    setLastImportChanges({ createdIds: summary.createdIds || [], updatedChanges: summary.updatedChanges || [] });
                                    if (summary.errors > 0 && Array.isArray(summary.errorDetails) && summary.errorDetails.length) {
                                        setImportErrors(summary.errorDetails);
                                        setShowImportErrors(true);
                                    }
                                    queryClient.invalidateQueries(['admin-locations']);
                                }}
                            />
                        )}



                        {/* Import Errors Dialog */}
                        <Dialog open={showImportErrors} onOpenChange={setShowImportErrors}>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto dark:bg-neutral-800 dark:border-neutral-700">
                                <DialogHeader>
                                    <DialogTitle className="text-neutral-900 dark:text-neutral-100">Ошибки импорта</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-2">
                                    {importErrors && importErrors.length > 0 ? (
                                        <div className="text-sm">
                                            <div className="grid grid-cols-6 gap-2 font-medium text-neutral-900 dark:text-neutral-300 mb-2">
                                                <div className="col-span-1">Строка</div>
                                                <div className="col-span-2">Название</div>
                                                <div className="col-span-3">Ошибки</div>
                                            </div>
                                            {importErrors.map((err, idx) => (
                                                <div key={idx} className="grid grid-cols-6 gap-2 py-2 border-t border-neutral-100 dark:border-neutral-700">
                                                    <div className="col-span-1 text-neutral-500 dark:text-neutral-400">{err.row ?? '-'}</div>
                                                    <div className="col-span-2 font-medium text-neutral-900 dark:text-neutral-100">{err.location || '-'}</div>
                                                    <div className="col-span-3 text-neutral-900 dark:text-neutral-300">
                                                        {Array.isArray(err.errors) ? err.errors.join('; ') : String(err.errors || '-')}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-neutral-900 dark:text-neutral-300">Нет деталей ошибок.</p>
                                    )}
                                </div>
                            </DialogContent>
                        </Dialog>

                        {/* Breadcrumbs Navigation */}
                        {!searchQuery && browsingLevel !== 'countries' && (
                            <div className="mb-4 flex items-center gap-2 text-sm">
                                <button
                                    onClick={goHome}
                                    className="text-neutral-700 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 font-medium"
                                >
                                    Все страны
                                </button>
                                {selectedCountry && (
                                    <>
                                        <span className="text-neutral-400 dark:text-neutral-600">/</span>
                                        <button
                                            onClick={() => {
                                                setBrowsingLevel('cities');
                                                setSelectedCity(null);
                                            }}
                                            className={`hover:text-neutral-900 dark:hover:text-neutral-100 font-medium ${browsingLevel === 'cities' ? 'text-neutral-900 dark:text-neutral-100' : 'text-neutral-700 dark:text-neutral-400'}`}
                                        >
                                            {selectedCountry}
                                        </button>
                                    </>
                                )}
                                {selectedCity && (
                                    <>
                                        <span className="text-neutral-400 dark:text-neutral-600">/</span>
                                        <span className="text-neutral-900 dark:text-neutral-100 font-semibold">{selectedCity}</span>
                                    </>
                                )}
                            </div>
                        )}

                        {/* COUNTRIES VIEW */}
                        {!searchQuery && browsingLevel === 'countries' && (
                            <Card className="shadow-sm border-0 dark:bg-neutral-800 dark:border dark:border-neutral-700">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg md:text-xl text-neutral-900 dark:text-neutral-100">Страны</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                        {countryData.map(country => (
                                            <div
                                                key={country.name}
                                                onClick={() => selectCountry(country.name)}
                                                className="group bg-white dark:bg-neutral-900 shadow-sm border-0 dark:border dark:border-neutral-700 rounded-xl overflow-hidden hover:shadow-lg transition-all cursor-pointer"
                                            >
                                                {/* Country Image */}
                                                <div className="relative h-32 bg-stone-100 dark:bg-neutral-800">
                                                    {country.image_url ? (
                                                        <img
                                                            src={country.image_url}
                                                            alt={country.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-neutral-400 dark:text-neutral-600">
                                                            <Globe className="w-8 h-8" />
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                                    <div className="absolute bottom-2 left-3">
                                                        <h3 className="text-lg font-bold text-white drop-shadow-lg">
                                                            {country.name}
                                                        </h3>
                                                    </div>
                                                </div>

                                                <div className="p-3">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-3 text-xs text-neutral-700 dark:text-neutral-400">
                                                            <span>{country.citiesCount} городов</span>
                                                            <span>•</span>
                                                            <span>{country.count} локаций</span>
                                                        </div>
                                                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    updateRegionStatusMutation.mutate({
                                                                        region_name: country.name,
                                                                        region_type: 'country',
                                                                        parent_region: null,
                                                                        is_active: !country.is_active || country.is_coming_soon,
                                                                        is_coming_soon: false
                                                                    });
                                                                }}
                                                                className={`h-6 px-2 text-xs ${country.is_active && !country.is_coming_soon
                                                                    ? 'bg-green-500 hover:bg-green-600 text-white border-green-500'
                                                                    : 'hover:bg-red-50 text-red-600 border-red-300'
                                                                    }`}
                                                                title={country.is_active && !country.is_coming_soon ? "Скрыть от пользователей" : "Активировать"}
                                                            >
                                                                {country.is_active && !country.is_coming_soon ? "Active" : "Hidden"}
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    updateRegionStatusMutation.mutate({
                                                                        region_name: country.name,
                                                                        region_type: 'country',
                                                                        parent_region: null,
                                                                        is_active: true,
                                                                        is_coming_soon: !country.is_coming_soon
                                                                    });
                                                                }}
                                                                className={`h-6 px-2 text-xs ${country.is_coming_soon
                                                                    ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500'
                                                                    : 'hover:bg-amber-50 text-amber-600 border-amber-300'
                                                                    }`}
                                                                title="Coming Soon"
                                                            >
                                                                CS
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    {/* Image Upload Section - Time of Day */}
                                                    <div className="mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-700" onClick={(e) => e.stopPropagation()}>
                                                        <Label className="text-xs text-neutral-700 dark:text-neutral-400 mb-2 block">Изображения по времени суток</Label>
                                                        <div className="space-y-2">
                                                            <div>
                                                                <div className="flex items-center justify-between mb-0.5">
                                                                    <Label className="text-[10px] text-neutral-500 dark:text-neutral-500">☀️ День</Label>
                                                                    {country.image_url_day && (
                                                                        <Badge variant="outline" className="h-4 px-1 text-[9px] bg-green-50 text-green-700 border-green-300">
                                                                            Загружено
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <Input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    key={`day-${country.image_url_day}`}
                                                                    onChange={async (e) => {
                                                                        const file = e.target.files?.[0];
                                                                        if (!file) return;
                                                                        try {
                                                                            toast.info('Загрузка изображения дня...');
                                                                            const { file_url } = await base44.integrations.Core.UploadFile({ file });
                                                                            await updateRegionStatusMutation.mutateAsync({
                                                                                region_name: country.name,
                                                                                region_type: 'country',
                                                                                parent_region: null,
                                                                                is_active: country.is_active,
                                                                                is_coming_soon: country.is_coming_soon,
                                                                                image_url_day: file_url
                                                                            });
                                                                            toast.success('Фото дня загружено!');
                                                                            e.target.value = '';
                                                                        } catch (error) {
                                                                            toast.error('Ошибка: ' + error.message);
                                                                        }
                                                                    }}
                                                                    className="text-xs h-7"
                                                                />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center justify-between mb-0.5">
                                                                    <Label className="text-[10px] text-neutral-500 dark:text-neutral-500">🌆 Вечер</Label>
                                                                    {country.image_url_evening && (
                                                                        <Badge variant="outline" className="h-4 px-1 text-[9px] bg-green-50 text-green-700 border-green-300">
                                                                            Загружено
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <Input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    key={`evening-${country.image_url_evening}`}
                                                                    onChange={async (e) => {
                                                                        const file = e.target.files?.[0];
                                                                        if (!file) return;
                                                                        try {
                                                                            toast.info('Загрузка изображения вечера...');
                                                                            const { file_url } = await base44.integrations.Core.UploadFile({ file });
                                                                            await updateRegionStatusMutation.mutateAsync({
                                                                                region_name: country.name,
                                                                                region_type: 'country',
                                                                                parent_region: null,
                                                                                is_active: country.is_active,
                                                                                is_coming_soon: country.is_coming_soon,
                                                                                image_url_evening: file_url
                                                                            });
                                                                            toast.success('Фото вечера загружено!');
                                                                            e.target.value = '';
                                                                        } catch (error) {
                                                                            toast.error('Ошибка: ' + error.message);
                                                                        }
                                                                    }}
                                                                    className="text-xs h-7"
                                                                />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center justify-between mb-0.5">
                                                                    <Label className="text-[10px] text-neutral-500 dark:text-neutral-500">🌙 Ночь</Label>
                                                                    {country.image_url_night && (
                                                                        <Badge variant="outline" className="h-4 px-1 text-[9px] bg-green-50 text-green-700 border-green-300">
                                                                            Загружено
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <Input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    key={`night-${country.image_url_night}`}
                                                                    onChange={async (e) => {
                                                                        const file = e.target.files?.[0];
                                                                        if (!file) return;
                                                                        try {
                                                                            toast.info('Загрузка изображения ночи...');
                                                                            const { file_url } = await base44.integrations.Core.UploadFile({ file });
                                                                            await updateRegionStatusMutation.mutateAsync({
                                                                                region_name: country.name,
                                                                                region_type: 'country',
                                                                                parent_region: null,
                                                                                is_active: country.is_active,
                                                                                is_coming_soon: country.is_coming_soon,
                                                                                image_url_night: file_url
                                                                            });
                                                                            toast.success('Фото ночи загружено!');
                                                                            e.target.value = '';
                                                                        } catch (error) {
                                                                            toast.error('Ошибка: ' + error.message);
                                                                        }
                                                                    }}
                                                                    className="text-xs h-7"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* CITIES VIEW */}
                        {!searchQuery && browsingLevel === 'cities' && (
                            <Card className="shadow-sm border-0 dark:bg-neutral-800 dark:border dark:border-neutral-700">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg md:text-xl text-neutral-900 dark:text-neutral-100">Города в {selectedCountry}</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                        {cityData.map(city => {
                                            const regionStatus = regionStatuses.find(rs =>
                                                rs.region_name === city.name &&
                                                rs.region_type === 'city' &&
                                                rs.parent_region === selectedCountry
                                            );
                                            return (
                                                <div
                                                    key={city.name}
                                                    onClick={() => selectCity(city.name)}
                                                    className="group bg-white dark:bg-neutral-900 shadow-sm border-0 dark:border dark:border-neutral-700 rounded-xl overflow-hidden hover:shadow-lg transition-all cursor-pointer"
                                                >
                                                    {/* City Image */}
                                                    <div className="relative h-32 bg-stone-100 dark:bg-neutral-800">
                                                        {city.image_url ? (
                                                            <img
                                                                src={city.image_url}
                                                                alt={city.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-neutral-400 dark:text-neutral-600">
                                                                <MapPin className="w-8 h-8" />
                                                            </div>
                                                        )}
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                                        <div className="absolute bottom-2 left-3">
                                                            <h3 className="text-lg font-bold text-white drop-shadow-lg">
                                                                {city.name}
                                                            </h3>
                                                        </div>
                                                    </div>

                                                    <div className="p-3">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="text-xs text-neutral-700 dark:text-neutral-400">
                                                                {city.count} локаций
                                                            </div>
                                                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        updateRegionStatusMutation.mutate({
                                                                            region_name: city.name,
                                                                            region_type: 'city',
                                                                            parent_region: selectedCountry,
                                                                            is_active: !city.is_active || city.is_coming_soon,
                                                                            is_coming_soon: false
                                                                        });
                                                                    }}
                                                                    className={`h-6 px-2 text-xs ${city.is_active && !city.is_coming_soon
                                                                        ? 'bg-green-500 hover:bg-green-600 text-white border-green-500'
                                                                        : 'hover:bg-red-50 text-red-600 border-red-300'
                                                                        }`}
                                                                    title={city.is_active && !city.is_coming_soon ? "Скрыть от пользователей" : "Активировать"}
                                                                >
                                                                    {city.is_active && !city.is_coming_soon ? "Active" : "Hidden"}
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        updateRegionStatusMutation.mutate({
                                                                            region_name: city.name,
                                                                            region_type: 'city',
                                                                            parent_region: selectedCountry,
                                                                            is_active: true,
                                                                            is_coming_soon: !city.is_coming_soon
                                                                        });
                                                                    }}
                                                                    className={`h-6 px-2 text-xs ${city.is_coming_soon
                                                                        ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500'
                                                                        : 'hover:bg-amber-50 text-amber-600 border-amber-300'
                                                                        }`}
                                                                    title="Coming Soon"
                                                                >
                                                                    CS
                                                                </Button>
                                                            </div>
                                                        </div>

                                                        {/* Image Upload Section */}
                                                        <div className="mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-700" onClick={(e) => e.stopPropagation()}>
                                                            <Label className="text-xs text-neutral-700 dark:text-neutral-400 mb-1 block">Изображение города</Label>
                                                            <div className="flex gap-2">
                                                                <Input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    onChange={async (e) => {
                                                                        const file = e.target.files?.[0];
                                                                        if (!file) return;

                                                                        try {
                                                                            toast.info('Загрузка изображения...');

                                                                            const { file_url } = await base44.integrations.Core.UploadFile({ file });

                                                                            updateRegionStatusMutation.mutate({
                                                                                region_name: city.name,
                                                                                region_type: 'city',
                                                                                parent_region: selectedCountry,
                                                                                is_active: city.is_active,
                                                                                is_coming_soon: city.is_coming_soon,
                                                                                image_url: file_url
                                                                            });
                                                                            toast.success('Изображение загружено!');
                                                                        } catch (error) {
                                                                            console.error(error);
                                                                            toast.error('Ошибка загрузки: ' + (error.message || 'Unknown error'));
                                                                        }
                                                                    }}
                                                                    className="text-xs h-8"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* LOCATIONS VIEW */}
                        {(searchQuery || browsingLevel === 'locations') && (
                            <Card className="shadow-sm border-0 dark:bg-neutral-800 dark:border dark:border-neutral-700">
                                <CardHeader className="flex flex-col md:flex-row gap-4 md:items-center justify-between space-y-0">
                                    <CardTitle className="text-lg md:text-xl text-neutral-900 dark:text-neutral-100">
                                        {browsingLevel === 'locations' && !searchQuery ? `${selectedCity}` : 'Управление локациями'}
                                    </CardTitle>
                                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                                        <div className="relative w-full sm:w-[200px] shrink-0">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                                            <Input
                                                placeholder="Поиск..."
                                                value={searchQuery}
                                                onChange={(e) => {
                                                    setSearchQuery(e.target.value);
                                                    if (e.target.value) {
                                                        setBrowsingLevel('locations');
                                                    }
                                                }}
                                                className="pl-9 w-full text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700 dark:placeholder:text-neutral-500"
                                            />
                                        </div>
                                        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 -mx-6 px-6 md:mx-0 md:px-0 no-scrollbar">
                                            <Select
                                                value={sortBy}
                                                onValueChange={setSortBy}
                                            >
                                                <SelectTrigger className="w-[150px] shrink-0 text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700">
                                                    <SelectValue placeholder="Сортировка" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="updated_date">Дата обновления</SelectItem>
                                                    <SelectItem value="created_date">Дата создания</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Select
                                                value={filterCountry}
                                                onValueChange={setFilterCountry}
                                            >
                                                <SelectTrigger className="w-[130px] shrink-0 text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700">
                                                    <SelectValue placeholder="Страна" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">Все страны</SelectItem>
                                                    {Array.from(new Set(locations.map(l => l.country).filter(Boolean))).sort().map(c => (
                                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Select
                                                value={filterCity}
                                                onValueChange={setFilterCity}
                                            >
                                                <SelectTrigger className="w-[130px] shrink-0 text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700">
                                                    <SelectValue placeholder="Город" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">Все города</SelectItem>
                                                    {Array.from(new Set(locations
                                                        .filter(l => filterCountry === 'all' || l.country === filterCountry)
                                                        .map(l => l.city)
                                                        .filter(Boolean)
                                                    )).sort().map(c => (
                                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Select
                                                value={filterPrice}
                                                onValueChange={setFilterPrice}
                                            >
                                                <SelectTrigger className="w-[100px] shrink-0 text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700">
                                                    <SelectValue placeholder="Цена" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">Любая</SelectItem>
                                                    <SelectItem value="$">$</SelectItem>
                                                    <SelectItem value="$$">$$</SelectItem>
                                                    <SelectItem value="$$$">$$$</SelectItem>
                                                    <SelectItem value="$$$$">$$$$</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[35%]">Название</TableHead>
                                                    <TableHead>Локация</TableHead>
                                                    <TableHead className="w-[100px]">Создано</TableHead>
                                                    <TableHead className="w-[100px]">Обновлено</TableHead>
                                                    <TableHead className="w-[80px]">Инфо</TableHead>
                                                    <TableHead className="text-right w-[80px]"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {paginatedLocations.length > 0 ? (
                                                    paginatedLocations.map(location => (
                                                        <TableRow
                                                            key={location.id}
                                                            className="hover:bg-stone-50 dark:hover:bg-neutral-900 cursor-pointer transition-colors h-10"
                                                            onClick={() => {
                                                                setEditingLocation(location);
                                                                setShowLocationForm(true);
                                                            }}
                                                        >
                                                            <TableCell className="font-medium py-2">
                                                                <div className="flex flex-col gap-0.5">
                                                                    <div className="truncate max-w-[180px] md:max-w-[250px] text-neutral-900 dark:text-neutral-100" title={location.name}>
                                                                        {location.name}
                                                                    </div>
                                                                    <span className="w-fit inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-300 border-0 dark:border dark:border-neutral-600">
                                                                        {location.type}
                                                                    </span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="py-2 text-sm text-neutral-700 dark:text-neutral-400">
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[100px] md:max-w-[180px]" title={location.city}>
                                                                        {location.city}
                                                                    </span>
                                                                    <span className="text-[10px] text-neutral-500 dark:text-neutral-500 truncate max-w-[100px] md:max-w-[180px]" title={location.country}>
                                                                        {location.country}
                                                                    </span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="py-2">
                                                                <div className="text-xs text-neutral-600 dark:text-neutral-400">
                                                                    {location.created_date ? format(new Date(location.created_date), 'dd.MM.yy') : '—'}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="py-2">
                                                                <TooltipProvider>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <div className="text-xs text-neutral-600 dark:text-neutral-400 cursor-help">
                                                                                {location.updated_date ? format(new Date(location.updated_date), 'dd.MM.yy') : '—'}
                                                                            </div>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent className="max-w-xs">
                                                                            <div className="text-xs space-y-1">
                                                                                <p className="font-semibold">Последнее обновление:</p>
                                                                                <p>{location.updated_date ? format(new Date(location.updated_date), 'dd MMMM yyyy, HH:mm') : 'Нет данных'}</p>
                                                                                <p className="text-neutral-400 text-[10px] mt-2">Детали изменений доступны в логах системы</p>
                                                                            </div>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            </TableCell>
                                                            <TableCell className="py-2">
                                                                <div className="flex gap-1">
                                                                    {location.is_hidden_gem && (
                                                                        <div title="Скрытая жемчужина" className="p-1 rounded bg-amber-100 text-amber-600 flex items-center justify-center w-6 h-6">
                                                                            <Star className="w-3.5 h-3.5 fill-current" />
                                                                        </div>
                                                                    )}
                                                                    {location.is_featured && (
                                                                        <div title="На главной" className="p-1 rounded bg-blue-100 text-blue-600 flex items-center justify-center w-6 h-6">
                                                                            <TrendingUp className="w-3.5 h-3.5" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right py-2" onClick={(e) => e.stopPropagation()}>
                                                                <div className="flex items-center justify-end gap-1">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-7 w-7 text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setEditingLocationId(location.id);
                                                                            setShowEditForm(true);
                                                                        }}
                                                                    >
                                                                        <Pencil className="w-3.5 h-3.5" />
                                                                    </Button>
                                                                    <AlertDialog>
                                                                        <AlertDialogTrigger asChild>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-7 w-7 text-neutral-400 dark:text-neutral-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                                                                onClick={(e) => e.stopPropagation()}
                                                                            >
                                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                            </Button>
                                                                        </AlertDialogTrigger>
                                                                        <AlertDialogContent>
                                                                            <AlertDialogHeader>
                                                                                <AlertDialogTitle>Удалить локацию?</AlertDialogTitle>
                                                                                <AlertDialogDescription>
                                                                                    Это действие нельзя отменить. Локация "{location.name}" будет удалена навсегда.
                                                                                </AlertDialogDescription>
                                                                            </AlertDialogHeader>
                                                                            <AlertDialogFooter>
                                                                                <AlertDialogCancel>Отмена</AlertDialogCancel>
                                                                                <AlertDialogAction
                                                                                    onClick={() => deleteMutation.mutate(location.id)}
                                                                                    className="bg-red-600 hover:bg-red-700"
                                                                                >
                                                                                    Удалить
                                                                                </AlertDialogAction>
                                                                            </AlertDialogFooter>
                                                                        </AlertDialogContent>
                                                                    </AlertDialog>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={6} className="h-24 text-center text-neutral-500 dark:text-neutral-400">
                                                            Нет локаций, соответствующих запросу
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                    {/* Pagination Controls */}
                                    {paginatedLocations.length > 0 && filteredLocations.length > itemsPerPage && (
                                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-700">
                                            <div className="text-xs text-neutral-500 dark:text-neutral-400 hidden sm:block">
                                                Показано {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredLocations.length)} из {filteredLocations.length}
                                            </div>
                                            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                    disabled={currentPage === 1}
                                                    className="h-8"
                                                >
                                                    <ChevronLeft className="w-4 h-4 mr-1" />
                                                    Назад
                                                </Button>
                                                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-300">
                                                    Стр. {currentPage} из {totalPages || 1}
                                                </span>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                    disabled={currentPage === totalPages}
                                                    className="h-8"
                                                >
                                                    Вперед
                                                    <ChevronRight className="w-4 h-4 ml-1" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    {/* Creator Moderation Tab */}
                    <TabsContent value="creator-moderation">
                        <Tabs defaultValue="moderation" className="space-y-6">
                            <TabsList className="bg-white dark:bg-neutral-800 p-1 rounded-2xl border-0 shadow-sm dark:border dark:border-neutral-700 w-full grid grid-cols-2 gap-0.5 md:h-12">
                                <TabsTrigger
                                    value="locations"
                                    className="data-[state=active]:bg-neutral-900 dark:data-[state=active]:bg-neutral-100 data-[state=active]:text-white dark:data-[state=active]:text-neutral-900 text-neutral-900 dark:text-neutral-300 rounded-xl h-full flex items-center justify-center text-sm"
                                >
                                    <MapPin className="w-4 h-4 mr-2" />
                                    Локации
                                </TabsTrigger>
                                <TabsTrigger
                                    value="moderation"
                                    className="data-[state=active]:bg-neutral-900 dark:data-[state=active]:bg-neutral-100 data-[state=active]:text-white dark:data-[state=active]:text-neutral-900 text-neutral-900 dark:text-neutral-300 rounded-xl h-full flex items-center justify-center text-sm relative"
                                >
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    На Модерации
                                    {newModerationRoundsCount > 0 && (
                                        <span className="ml-2 bg-purple-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                            {newModerationRoundsCount > 99 ? '99+' : newModerationRoundsCount}
                                        </span>
                                    )}
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="locations">
                                <ModerationLocationsTab locations={locations} />
                            </TabsContent>

                            <TabsContent value="moderation">
                                <CreatorModerationTab />
                            </TabsContent>
                        </Tabs>
                    </TabsContent>

                    {/* Moderation Tab */}
                    <TabsContent value="moderation">
                        {/* Moderation Dialog */}
                        <Dialog open={showLocationForm && editingLocation?.status === 'pending'} onOpenChange={(open) => {
                            if (!open) {
                                setShowLocationForm(false);
                                setEditingLocation(null);
                            }
                        }}>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto dark:bg-neutral-800 dark:border-neutral-700">
                                <DialogHeader>
                                    <DialogTitle className="text-neutral-900 dark:text-neutral-100">
                                        Модерация локации
                                    </DialogTitle>
                                </DialogHeader>
                                <LocationForm
                                    location={editingLocation}
                                    onSubmit={(data) => locationMutation.mutate(data)}
                                    isLoading={locationMutation.isPending}
                                />
                            </DialogContent>
                        </Dialog>

                        <Card className="shadow-sm border-0 dark:bg-neutral-800 dark:border dark:border-neutral-700">
                            <CardHeader>
                                <CardTitle className="text-neutral-900 dark:text-neutral-100">Локации на модерации</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Название</TableHead>
                                                <TableHead>Создатель</TableHead>
                                                <TableHead>Локация</TableHead>
                                                <TableHead>Дата подачи</TableHead>
                                                <TableHead className="text-right">Действия</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {pendingLocations.length > 0 ? (
                                                pendingLocations.map(location => (
                                                    <TableRow
                                                        key={location.id}
                                                        className="hover:bg-stone-50 dark:hover:bg-neutral-900 cursor-pointer transition-colors"
                                                        onClick={() => {
                                                            setEditingLocation(location);
                                                            setShowLocationForm(true);
                                                        }}
                                                    >
                                                        <TableCell className="font-medium">
                                                            <div className="flex flex-col gap-0.5">
                                                                <span className="truncate max-w-[200px] text-neutral-900 dark:text-neutral-100" title={location.name}>
                                                                    {location.name}
                                                                </span>
                                                                <Badge variant="outline" className="w-fit text-[10px]">
                                                                    {location.type}
                                                                </Badge>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex flex-col">
                                                                <span className="font-medium text-sm text-neutral-900 dark:text-neutral-100">{location.created_by_name}</span>
                                                                <span className="text-xs text-neutral-500 dark:text-neutral-500">{location.created_by}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-sm">
                                                            <div className="flex flex-col">
                                                                <span className="font-medium text-neutral-900 dark:text-neutral-100">{location.city}</span>
                                                                <span className="text-xs text-neutral-500 dark:text-neutral-500">{location.country}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-xs text-neutral-500 dark:text-neutral-500">
                                                            {location.created_date && format(new Date(location.created_date), 'dd.MM.yyyy HH:mm')}
                                                        </TableCell>
                                                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                                            <div className="flex items-center justify-end gap-1">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setEditingLocation(location);
                                                                        setShowLocationForm(true);
                                                                    }}
                                                                    title="Редактировать"
                                                                >
                                                                    <Pencil className="w-3.5 h-3.5" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-7 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        publishLocationMutation.mutate(location.id);
                                                                    }}
                                                                    title="Опубликовать"
                                                                >
                                                                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                                                    Опубликовать
                                                                </Button>
                                                                <AlertDialog>
                                                                    <AlertDialogTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                            title="Отклонить"
                                                                        >
                                                                            <X className="w-3.5 h-3.5 mr-1" />
                                                                            Отклонить
                                                                        </Button>
                                                                    </AlertDialogTrigger>
                                                                    <AlertDialogContent>
                                                                        <AlertDialogHeader>
                                                                            <AlertDialogTitle>Отклонить локацию?</AlertDialogTitle>
                                                                            <AlertDialogDescription>
                                                                                Локация "{location.name}" будет отклонена и не будет опубликована.
                                                                            </AlertDialogDescription>
                                                                        </AlertDialogHeader>
                                                                        <AlertDialogFooter>
                                                                            <AlertDialogCancel>Отмена</AlertDialogCancel>
                                                                            <AlertDialogAction
                                                                                onClick={() => rejectLocationMutation.mutate(location.id)}
                                                                                className="bg-red-600 hover:bg-red-700"
                                                                            >
                                                                                Отклонить
                                                                            </AlertDialogAction>
                                                                        </AlertDialogFooter>
                                                                    </AlertDialogContent>
                                                                </AlertDialog>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="h-24 text-center text-neutral-500 dark:text-neutral-400">
                                                        Нет локаций на модерации
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Reviews Tab */}
                    <TabsContent value="reviews">
                        <Dialog open={showReviewDetail} onOpenChange={setShowReviewDetail}>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto dark:bg-neutral-800 dark:border-neutral-700">
                                <DialogHeader>
                                    <DialogTitle className="text-neutral-900 dark:text-neutral-100">Детали отзыва</DialogTitle>
                                </DialogHeader>
                                <ReviewDetail
                                    review={selectedReview}
                                    onStatusChange={(id, status, is_hidden) => reviewMutation.mutate({ id, status, is_hidden })}
                                    onClose={() => setShowReviewDetail(false)}
                                />
                            </DialogContent>
                        </Dialog>
                        <Card className="shadow-sm border-0 dark:bg-neutral-800 dark:border dark:border-neutral-700">
                            <CardHeader>
                                <CardTitle className="text-neutral-900 dark:text-neutral-100">Отзывы</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4">
                                {/* Desktop Table View */}
                                <div className="hidden md:block overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Дата</TableHead>
                                                <TableHead>Локация ID</TableHead>
                                                <TableHead>Пользователь</TableHead>
                                                <TableHead>Рейтинг</TableHead>
                                                <TableHead>Статус</TableHead>
                                                <TableHead className="text-right">Действия</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {reviews.length > 0 ? (
                                                reviews.map(review => (
                                                    <TableRow
                                                        key={review.id}
                                                        className="cursor-pointer hover:bg-stone-50 dark:hover:bg-neutral-900 transition-colors"
                                                        onClick={() => {
                                                            setSelectedReview(review);
                                                            setShowReviewDetail(true);
                                                        }}
                                                    >
                                                        <TableCell className="whitespace-nowrap text-xs text-neutral-500 dark:text-neutral-400">
                                                            {review.created_date && format(new Date(review.created_date), 'dd.MM.yyyy HH:mm')}
                                                        </TableCell>
                                                        <TableCell className="font-mono text-xs max-w-[100px] truncate text-neutral-900 dark:text-neutral-300" title={review.location_id}>
                                                            {review.location_id}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex flex-col">
                                                                <span className="font-medium text-sm text-neutral-900 dark:text-neutral-100">{review.user_name}</span>
                                                                <span className="text-xs text-neutral-500 dark:text-neutral-500">{review.user_email}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-1">
                                                                {[...Array(review.rating)].map((_, i) => (
                                                                    <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                                                                ))}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <Badge className={
                                                                    review.status === 'pending' ? 'bg-orange-500' :
                                                                        review.status === 'approved' ? 'bg-green-500' :
                                                                            review.status === 'rejected' ? 'bg-red-500' : 'bg-stone-500'
                                                                }>
                                                                    {review.status === 'pending' ? 'На модерации' :
                                                                        review.status === 'approved' ? 'Одобрено' :
                                                                            review.status === 'rejected' ? 'Отклонено' : 'Скрыто'}
                                                                </Badge>
                                                                {review.is_hidden && (
                                                                    <Badge variant="outline" className="bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-300 text-[10px]">
                                                                        Скрыто
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                        <MoreVertical className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem
                                                                        onClick={() => reviewMutation.mutate({ id: review.id, status: 'approved', is_hidden: false })}
                                                                        disabled={review.status === 'approved' && !review.is_hidden}
                                                                    >
                                                                        <CheckCircle2 className="w-4 h-4 mr-2" /> Одобрить
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() => reviewMutation.mutate({ id: review.id, status: 'rejected', is_hidden: true })}
                                                                        disabled={review.status === 'rejected'}
                                                                    >
                                                                        <X className="w-4 h-4 mr-2" /> Отклонить
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => reviewMutation.mutate({ id: review.id, is_hidden: !review.is_hidden })}>
                                                                        {review.is_hidden ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
                                                                        {review.is_hidden ? 'Показать' : 'Скрыть'}
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="h-24 text-center text-neutral-500 dark:text-neutral-400">
                                                        Нет отзывов
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Mobile Card View */}
                                <div className="md:hidden space-y-3">
                                    {reviews.length > 0 ? (
                                        reviews.map(review => (
                                            <div
                                                key={review.id}
                                                className="bg-white dark:bg-neutral-800 shadow-sm border-0 dark:border dark:border-neutral-700 rounded-xl p-4 active:bg-neutral-50 dark:active:bg-neutral-900 transition-colors"
                                                onClick={() => {
                                                    setSelectedReview(review);
                                                    setShowReviewDetail(true);
                                                }}
                                            >
                                                <div className="flex items-start justify-between gap-3 mb-3">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-semibold text-sm mb-1 text-neutral-900 dark:text-neutral-100">{review.user_name}</div>
                                                        <div className="text-xs text-neutral-500 dark:text-neutral-500 truncate">{review.user_email}</div>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        {[...Array(review.rating)].map((_, i) => (
                                                            <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    <Badge className={
                                                        review.status === 'pending' ? 'bg-orange-500' :
                                                            review.status === 'approved' ? 'bg-green-500' :
                                                                review.status === 'rejected' ? 'bg-red-500' : 'bg-stone-500'
                                                    }>
                                                        {review.status === 'pending' ? 'На модерации' :
                                                            review.status === 'approved' ? 'Одобрено' :
                                                                review.status === 'rejected' ? 'Отклонено' : 'Скрыто'}
                                                    </Badge>
                                                    {review.is_hidden && (
                                                        <Badge variant="outline" className="bg-stone-100 text-stone-600 text-[10px]">
                                                            Скрыто
                                                        </Badge>
                                                    )}
                                                </div>

                                                {review.comment && (
                                                    <p className="text-xs text-neutral-900 dark:text-neutral-300 line-clamp-2 mb-3">
                                                        {review.comment}
                                                    </p>
                                                )}

                                                <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-500">
                                                    <span>{review.created_date && format(new Date(review.created_date), 'dd.MM HH:mm')}</span>
                                                    <span className="font-mono truncate max-w-[120px]" title={review.location_id}>
                                                        {review.location_id}
                                                    </span>
                                                </div>

                                                <div className="flex gap-2 mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-700" onClick={(e) => e.stopPropagation()}>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="flex-1 text-green-600 border-green-200 hover:bg-green-50"
                                                        onClick={() => reviewMutation.mutate({ id: review.id, status: 'approved', is_hidden: false })}
                                                        disabled={review.status === 'approved' && !review.is_hidden}
                                                    >
                                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                                        Одобрить
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                                                        onClick={() => reviewMutation.mutate({ id: review.id, status: 'rejected', is_hidden: true })}
                                                        disabled={review.status === 'rejected'}
                                                    >
                                                        <X className="w-3 h-3 mr-1" />
                                                        Отклонить
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => reviewMutation.mutate({ id: review.id, is_hidden: !review.is_hidden })}
                                                    >
                                                        {review.is_hidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                                    </Button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
                                            Нет отзывов
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Subscriptions Tab */}
                    <TabsContent value="subscriptions">
                        <div className="mb-6 flex justify-end">
                            <Dialog open={showSubscriptionForm} onOpenChange={setShowSubscriptionForm}>
                                <DialogTrigger asChild>
                                    <Button className="w-full md:w-auto bg-stone-900 text-white hover:bg-stone-800">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Добавить подписку
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md dark:bg-neutral-800 dark:border-neutral-700">
                                    <DialogHeader>
                                        <DialogTitle className="text-neutral-900 dark:text-neutral-100">Добавить подписку</DialogTitle>
                                    </DialogHeader>
                                    <SubscriptionForm
                                        users={users}
                                        onSubmit={(data) => createSubscriptionMutation.mutate(data)}
                                        isLoading={createSubscriptionMutation.isPending}
                                    />
                                </DialogContent>
                            </Dialog>
                        </div>
                        <Card className="shadow-sm border-0 dark:bg-neutral-800 dark:border dark:border-neutral-700">
                            <CardHeader>
                                <CardTitle className="text-neutral-900 dark:text-neutral-100">Подписки</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Пользователь</TableHead>
                                                <TableHead>План</TableHead>
                                                <TableHead>Статус</TableHead>
                                                <TableHead>Дата начала</TableHead>
                                                <TableHead>Дата окончания</TableHead>
                                                <TableHead>Сумма</TableHead>
                                                <TableHead className="text-right">Действия</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {subscriptions.map(sub => (
                                                <TableRow key={sub.id}>
                                                    <TableCell className="font-medium text-neutral-900 dark:text-neutral-100">{sub.user_email}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">{sub.plan}</Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className={
                                                            sub.status === 'active' ? 'bg-green-500' :
                                                                sub.status === 'expired' ? 'bg-stone-500' : 'bg-red-500'
                                                        }>
                                                            {sub.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {sub.start_date && format(new Date(sub.start_date), 'dd.MM.yyyy')}
                                                    </TableCell>
                                                    <TableCell>
                                                        {sub.end_date && format(new Date(sub.end_date), 'dd.MM.yyyy')}
                                                    </TableCell>
                                                    <TableCell>${sub.amount_paid?.toLocaleString()}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Select
                                                            value={sub.status}
                                                            onValueChange={(status) => subscriptionMutation.mutate({ id: sub.id, status })}
                                                        >
                                                            <SelectTrigger className="w-[120px]">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="active">Active</SelectItem>
                                                                <SelectItem value="expired">Expired</SelectItem>
                                                                <SelectItem value="cancelled">Cancelled</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Users Tab */}
                    <TabsContent value="users">
                        <Card className="shadow-sm border-0 dark:bg-neutral-800 dark:border dark:border-neutral-700">
                            <CardHeader>
                                <CardTitle className="text-neutral-900 dark:text-neutral-100">Пользователи</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Имя</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Роль</TableHead>
                                                <TableHead>Подписка</TableHead>
                                                <TableHead>Дата регистрации</TableHead>
                                                <TableHead className="text-right">Действия</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {users.map(u => {
                                                const userSub = subscriptions.find(s => s.user_email === u.email && s.status === 'active');
                                                return (
                                                    <TableRow key={u.id}>
                                                        <TableCell className="font-medium text-neutral-900 dark:text-neutral-100">{u.full_name}</TableCell>
                                                        <TableCell className="text-neutral-900 dark:text-neutral-100">{u.email}</TableCell>
                                                        <TableCell>
                                                            <Badge variant={(u.role === 'admin' || u.custom_role === 'admin') ? 'default' : (u.custom_role === 'creator' ? 'outline' : 'secondary')}>
                                                                {u.custom_role || u.role}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            {userSub ? (
                                                                <Badge className="bg-green-500">{userSub.plan}</Badge>
                                                            ) : (
                                                                <Badge variant="outline">Нет</Badge>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            {u.created_date && format(new Date(u.created_date), 'dd.MM.yyyy')}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Select
                                                                value={u.custom_role || u.role}
                                                                onValueChange={(custom_role) => updateUserRoleMutation.mutate({ id: u.id, custom_role })}
                                                            >
                                                                <SelectTrigger className="w-[120px]">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="user">User</SelectItem>
                                                                    <SelectItem value="creator">Creator</SelectItem>
                                                                    <SelectItem value="admin">Admin</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* AI Management Tab */}
                    <TabsContent value="ai-management">
                        <AIManagementTab />
                    </TabsContent>

                    {/* Feedback Tab */}
                    <TabsContent value="feedback">
                        <Dialog open={showFeedbackDetail} onOpenChange={setShowFeedbackDetail}>
                            <DialogContent className="max-w-2xl dark:bg-neutral-800 dark:border-neutral-700">
                                <DialogHeader>
                                    <DialogTitle className="text-neutral-900 dark:text-neutral-100">Детали обращения</DialogTitle>
                                </DialogHeader>
                                <FeedbackDetail
                                    feedback={selectedFeedback}
                                    onStatusChange={(id, status) => feedbackMutation.mutate({ id, status })}
                                    onClose={() => setShowFeedbackDetail(false)}
                                />
                            </DialogContent>
                        </Dialog>
                        <Card className="shadow-sm border-0 dark:bg-neutral-800 dark:border dark:border-neutral-700">
                            <CardHeader>
                                <CardTitle className="text-neutral-900 dark:text-neutral-100">Обратная связь</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Дата</TableHead>
                                                <TableHead>Пользователь</TableHead>
                                                <TableHead>Тип</TableHead>
                                                <TableHead>Сообщение</TableHead>
                                                <TableHead>Статус</TableHead>
                                                <TableHead className="text-right">Действия</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {feedback.map(item => (
                                                <TableRow
                                                    key={item.id}
                                                    className="cursor-pointer hover:bg-stone-50 dark:hover:bg-neutral-900 transition-colors"
                                                    onClick={() => {
                                                        setSelectedFeedback(item);
                                                        setShowFeedbackDetail(true);
                                                    }}
                                                >
                                                    <TableCell className="whitespace-nowrap text-xs text-neutral-500 dark:text-neutral-400">
                                                        {item.created_date && format(new Date(item.created_date), 'dd.MM.yyyy HH:mm')}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-sm text-neutral-900 dark:text-neutral-100">{item.user_name}</span>
                                                            <span className="text-xs text-neutral-500 dark:text-neutral-500">{item.user_email}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className={
                                                            item.type === 'bug' ? 'bg-red-50 text-red-700 border-red-200' :
                                                                item.type === 'feature' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                                    item.type === 'partnership' ? 'bg-purple-50 text-purple-700 border-purple-200' : ''
                                                        }>
                                                            {item.type === 'bug' ? 'Ошибка' :
                                                                item.type === 'feature' ? 'Идея' :
                                                                    item.type === 'partnership' ? 'Партнёрство' : 'Вопрос'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="max-w-[300px]">
                                                        <p className="truncate hover:whitespace-normal hover:bg-neutral-50 dark:hover:bg-neutral-900 text-neutral-900 dark:text-neutral-100 p-1 rounded transition-all cursor-default" title={item.message}>
                                                            {item.message}
                                                        </p>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className={
                                                            item.status === 'new' ? 'bg-amber-500' :
                                                                item.status === 'in_progress' ? 'bg-blue-500' :
                                                                    item.status === 'resolved' ? 'bg-green-500' : 'bg-stone-500'
                                                        }>
                                                            {item.status === 'new' ? 'Новое' :
                                                                item.status === 'in_progress' ? 'В работе' :
                                                                    item.status === 'resolved' ? 'Решено' : 'Архив'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-1">
                                                            {item.status !== 'resolved' && (
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="h-8 w-8 hover:bg-green-50 hover:text-green-600"
                                                                    onClick={() => feedbackMutation.mutate({ id: item.id, status: 'resolved' })}
                                                                    title="Отметить решенным"
                                                                >
                                                                    <CheckCircle2 className="w-4 h-4" />
                                                                </Button>
                                                            )}
                                                            {item.status !== 'archived' && (
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="h-8 w-8 hover:bg-stone-100"
                                                                    onClick={() => feedbackMutation.mutate({ id: item.id, status: 'archived' })}
                                                                    title="В архив"
                                                                >
                                                                    <Archive className="w-4 h-4" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {feedback.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="h-24 text-center text-neutral-500 dark:text-neutral-400">
                                                        Запросов пока нет
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Bulk Editor */}
                <BulkEditor
                    isOpen={showBulkEditor}
                    onOpenChange={setShowBulkEditor}
                    rows={filteredLocations}
                    onSaved={() => {
                        setShowBulkEditor(false);
                        queryClient.invalidateQueries(['admin-locations']);
                        queryClient.invalidateQueries(['admin-pending-locations']);
                    }}
                />

                {/* Creator Location Edit Form */}
                <CreatorLocationEditForm
                    isOpen={showEditForm}
                    onOpenChange={setShowEditForm}
                    locationId={editingLocationId}
                    user={user}
                    onSuccess={() => {
                        setShowEditForm(false);
                        setEditingLocationId(null);
                        queryClient.invalidateQueries(['admin-locations']);
                        queryClient.invalidateQueries(['admin-pending-locations']);
                    }}
                />

            </main>
        </div>
    );
}

function SubscriptionForm({ users, onSubmit, isLoading }) {
    const [formData, setFormData] = useState({
        user_email: '',
        plan: 'monthly',
        status: 'active',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
        amount_paid: '9.99'
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            ...formData,
            amount_paid: parseFloat(formData.amount_paid)
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Label className="text-neutral-900 dark:text-neutral-300">Пользователь</Label>
                <Select value={formData.user_email} onValueChange={(v) => setFormData({ ...formData, user_email: v })}>
                    <SelectTrigger className="text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700">
                        <SelectValue placeholder="Выберите пользователя" />
                    </SelectTrigger>
                    <SelectContent>
                        {users.map(u => (
                            <SelectItem key={u.id} value={u.email}>{u.full_name || u.email} ({u.email})</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label className="text-neutral-900 dark:text-neutral-300">План</Label>
                    <Select value={formData.plan} onValueChange={(v) => {
                        // Auto-calculate end date and price based on plan
                        const now = new Date(formData.start_date);
                        let end = new Date(now);
                        let price = '9.99';

                        if (v === 'monthly') {
                            end.setMonth(end.getMonth() + 1);
                            price = '9.99';
                        } else if (v === 'yearly') {
                            end.setFullYear(end.getFullYear() + 1);
                            price = '49.99';
                        } else {
                            end.setFullYear(end.getFullYear() + 100);
                            price = '149.99';
                        }

                        setFormData({
                            ...formData,
                            plan: v,
                            end_date: end.toISOString().split('T')[0],
                            amount_paid: price
                        });
                    }}>
                        <SelectTrigger className="text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="monthly">Месячный</SelectItem>
                            <SelectItem value="yearly">Годовой</SelectItem>
                            <SelectItem value="lifetime">Навсегда</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label className="text-neutral-900 dark:text-neutral-300">Статус</Label>
                    <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                        <SelectTrigger className="text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="expired">Expired</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label className="text-neutral-900 dark:text-neutral-300">Дата начала</Label>
                    <Input
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        className="text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700"
                    />
                </div>
                <div>
                    <Label className="text-neutral-900 dark:text-neutral-300">Дата окончания</Label>
                    <Input
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                        className="text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700"
                    />
                </div>
            </div>

            <div>
                <Label className="text-neutral-900 dark:text-neutral-300">Сумма оплаты ($)</Label>
                <Input
                    type="number"
                    step="0.01"
                    value={formData.amount_paid}
                    onChange={(e) => setFormData({ ...formData, amount_paid: e.target.value })}
                    className="text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700 dark:placeholder:text-neutral-500"
                />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading || !formData.user_email}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Создать подписку
            </Button>
        </form>
    );
}

function LocationForm({ location, onSubmit, isLoading }) {
    const [formData, setFormData] = useState({
        name: location?.name || '',
        type: location?.type || 'cafe',
        country: location?.country || '',
        city: location?.city || '',
        address: location?.address || '',
        description: location?.description || '',
        insider_tip: location?.insider_tip || '',
        must_try: location?.must_try || '',
        price_range: location?.price_range || '$$',
        website: location?.website || '',
        phone: location?.phone || '',
        opening_hours: location?.opening_hours || '',
        booking_url: location?.booking_url || '',
        image_url: location?.image_url || '',
        latitude: location?.latitude || '',
        longitude: location?.longitude || '',
        is_hidden_gem: location?.is_hidden_gem || false,
        is_featured: location?.is_featured || false,
        special_labels: location?.special_labels || [],
        social_links: location?.social_links || [],
        best_time_to_visit: location?.best_time_to_visit || [],
        tags: location?.tags || []
    });
    const [branches, setBranches] = useState([{
        id: Date.now(),
        branch_name: '',
        address: location?.address || '',
        latitude: location?.latitude || '',
        longitude: location?.longitude || '',
        phone: location?.phone || '',
        opening_hours: location?.opening_hours || '',
        is_main: true
    }]);
    const [smartSearchQuery, setSmartSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [generatingContent, setGeneratingContent] = useState({
        description: false,
        insider_tip: false,
        must_try: false
    });
    const [uploadingImage, setUploadingImage] = useState(false);
    const [socialLinkInput, setSocialLinkInput] = useState('');
    const [tagsInput, setTagsInput] = useState(location?.tags?.join(', ') || '');

    // Sync tags input when location changes
    useEffect(() => {
        setTagsInput(location?.tags?.join(', ') || '');
    }, [location?.id]);

    // Load existing branches when editing
    useEffect(() => {
        const loadBranches = async () => {
            if (location?.id) {
                try {
                    const existingBranches = await base44.entities.LocationBranch.filter({ location_id: location.id });
                    if (existingBranches.length > 0) {
                        setBranches(existingBranches.map(b => ({
                            id: b.id,
                            branch_name: b.branch_name || '',
                            address: b.address,
                            latitude: b.latitude,
                            longitude: b.longitude,
                            phone: b.phone || '',
                            opening_hours: b.opening_hours || '',
                            is_main: b.is_main || false
                        })));
                    }
                } catch (error) {
                    console.error('Error loading branches:', error);
                }
            }
        };
        loadBranches();
    }, [location?.id]);

    const handleSmartSearch = async () => {
        if (!smartSearchQuery.trim()) return;
        setIsSearching(true);
        try {
            const prompt = `You are a location data extraction assistant. Your task is to comprehensively search the internet and find REAL, VERIFIED information about: "${smartSearchQuery}"

COMPREHENSIVE SEARCH STRATEGY:
1. FIRST: Search on Google Maps for exact location, coordinates, and basic info
2. THEN: Find the venue's official website (if available from the link or search)
3. NEXT: Search for the venue's social media pages (Instagram, Facebook, TikTok, etc.) for additional info, photos, and popular items
4. ALSO: Check review platforms (TripAdvisor, Yelp, Google Reviews) for "must-try" items and detailed descriptions
5. FINALLY: Look for blog posts, articles, or guides mentioning this venue

WHAT TO EXTRACT:
- Name, address, coordinates from Google Maps (PRIORITY)
- Official website URL if exists
- Social media pages (Instagram, Facebook, etc.) - these often have the best photos and info
- Description from multiple sources (website, social media, reviews)
- Popular dishes/items mentioned in reviews or social media posts
- Price range based on menu/reviews
- Photos from official sources or social media
- Opening hours from Google Places (in text format like "Mon-Fri: 9:00-22:00")
- Best time to visit based on type and available menus (утро/день/вечер/поздняя ночь)
- Check if they have breakfast menu, lunch menu, or serve late dinner

IMPORTANT RULES:
1. Extract information from MULTIPLE sources, not just one link
2. Social media pages (especially Instagram) often have the most current info and photos
3. If the provided link has limited info, actively search for additional sources
4. For coordinates: use exact GPS from Google Maps
5. For description: combine info from website, social media, and reviews to create comprehensive 2-3 sentence description
6. For must_try: check reviews and social media comments for popular recommendations
7. Use empty string "" for any field where NO information is found after searching multiple sources

Return a JSON object with these fields:
- name: exact name of the place
- type: one of [cafe, bar, restaurant, market, shop, bakery, winery]
- country: country name
- city: city name
- address: full street address with city
- description: comprehensive description (2-3 sentences) based on multiple sources
- price_range: one of [$, $$, $$$, $$$$] based on available info
- website: official website URL (empty if not found)
- latitude: exact GPS latitude from Google Maps (0 if not found)
- longitude: exact GPS longitude from Google Maps (0 if not found)
- image_url: URL to quality photo from official sources or social media (empty if not found)
- must_try: popular dish/item from reviews/social media (empty if not found)
- social_links: array of social media URLs found (Instagram, Facebook, etc.)
- opening_hours: opening hours in text format from Google Places (empty if not found)
- best_time_to_visit: array of strings ["утро", "день", "вечер", "поздняя ночь"] based on type and menus
- special_labels: array including "breakfastMenu", "lunchMenu", "lateDinner" if applicable

CRITICAL: Search MULTIPLE sources. Don't rely on just one link. Social media pages often have the best current information.`;

            const result = await base44.integrations.Core.InvokeLLM({
                prompt,
                add_context_from_internet: true,
                response_json_schema: {
                    type: "object",
                    properties: {
                        name: { type: "string" },
                        type: { type: "string" },
                        country: { type: "string" },
                        city: { type: "string" },
                        address: { type: "string" },
                        description: { type: "string" },
                        price_range: { type: "string" },
                        website: { type: "string" },
                        latitude: { type: "number" },
                        longitude: { type: "number" },
                        image_url: { type: "string" },
                        must_try: { type: "string" },
                        social_links: {
                            type: "array",
                            items: { type: "string" }
                        },
                        opening_hours: { type: "string" },
                        best_time_to_visit: {
                            type: "array",
                            items: { type: "string" }
                        },
                        special_labels: {
                            type: "array",
                            items: { type: "string" }
                        }
                    }
                }
            });

            if (result) {
                // Filter out empty/zero values before setting
                const filteredResult = Object.entries(result).reduce((acc, [key, value]) => {
                    if (key === 'social_links') {
                        acc[key] = Array.isArray(value) ? value.filter(link => link && link !== "") : [];
                    } else if (value && value !== "" && value !== 0) {
                        acc[key] = value;
                    }
                    return acc;
                }, {});

                setFormData(prev => ({
                    ...prev,
                    ...filteredResult,
                    is_hidden_gem: prev.is_hidden_gem,
                    is_featured: prev.is_featured,
                    special_labels: [...(prev.special_labels || []), ...(filteredResult.special_labels || [])]
                        .filter((label, index, self) => self.indexOf(label) === index),
                    social_links: [...(prev.social_links || []), ...(filteredResult.social_links || [])]
                        .filter((link, index, self) => self.indexOf(link) === index),
                    best_time_to_visit: filteredResult.best_time_to_visit || prev.best_time_to_visit || []
                }));
                toast.success('Данные успешно заполнены из множества источников!');
            }
        } catch (error) {
            console.error(error);
            toast.error('Не удалось найти информацию');
        } finally {
            setIsSearching(false);
        }
    };

    const detectLanguage = (text) => {
        if (!text) return 'english';
        if (/[а-яА-ЯёЁ]/.test(text)) return 'russian';
        if (/[іїєґІЇЄҐ]/.test(text)) return 'ukrainian';
        if (/[áéíóúñ¿¡]/.test(text)) return 'spanish';
        return 'english';
    };

    const generateContent = async (field) => {
        if (!formData.name || !formData.city || !formData.country) {
            toast.error('Заполните название, город и страну для генерации');
            return;
        }

        setGeneratingContent(prev => ({ ...prev, [field]: true }));
        try {
            let prompt = '';
            let jsonSchema = {};
            const existingText = formData[field];

            // Detect language from existing text
            const detectedLang = detectLanguage(existingText);
            const languageInstruction = detectedLang === 'russian' ? 'Пиши на русском языке.' :
                detectedLang === 'ukrainian' ? 'Пиши українською мовою.' :
                    detectedLang === 'spanish' ? 'Escribe en español.' :
                        'Write in English language.';

            if (field === 'description') {
                if (existingText && existingText.trim()) {
                    prompt = `Ты опытный копирайтер, пишущий дружелюбным и casual тоном. Улучши описание для "${formData.name}" - ${formData.type} в ${formData.city}, ${formData.country}.

Текущее описание: "${existingText}"

Перепиши его более живо и увлекательно (2-3 предложения). Пиши как друг, который делится находкой - естественно, с энтузиазмом, но без лишней формальности. Передай атмосферу места и что делает его особенным. ${languageInstruction}`;
                } else {
                    prompt = `Напиши дружелюбное и увлекательное описание (2-3 предложения) для "${formData.name}" - ${formData.type} в ${formData.city}, ${formData.country}. 
Пиши как друг, который делится крутой находкой - естественно, с энтузиазмом, передавая атмосферу места. Русский язык.`;
                }
                jsonSchema = {
                    type: "object",
                    properties: {
                        description: { type: "string" }
                    }
                };
            } else if (field === 'insider_tip') {
                if (existingText && existingText.trim()) {
                    prompt = `Улучши инсайдерский совет для "${formData.name}" в ${formData.city}, ${formData.country}.
                    
Текущий совет: "${existingText}"

Перепиши его как совет от друга-местного, который знает все фишки (1-2 предложения). Пиши дружелюбно и casual - как в переписке, не формально. ${languageInstruction}`;
                } else {
                    prompt = `Напиши инсайдерский совет (1-2 предложения) для "${formData.name}" в ${formData.city}, ${formData.country}. 
Расскажи про секреты, лучшее время визита или скрытые пункты меню. Пиши как друг-местный - естественно, дружелюбно. Русский язык.`;
                }
                jsonSchema = {
                    type: "object",
                    properties: {
                        insider_tip: { type: "string" }
                    }
                };
            } else if (field === 'must_try') {
                if (existingText && existingText.trim()) {
                    prompt = `Улучши рекомендацию для "${formData.name}" (${formData.type} в ${formData.city}).
                    
Текущая рекомендация: "${existingText}"

Перепиши более заманчиво и конкретно. Коротко, но аппетитно - как друг советует что обязательно попробовать. ${languageInstruction}`;
                } else {
                    prompt = `Что обязательно стоит попробовать в "${formData.name}" (${formData.type} в ${formData.city})? 
Дай короткую конкретную рекомендацию (название блюда и краткое описание). Пиши как друг - casual и дружелюбно. Русский язык.`;
                }
                jsonSchema = {
                    type: "object",
                    properties: {
                        must_try: { type: "string" }
                    }
                };
            }

            const result = await base44.integrations.Core.InvokeLLM({
                prompt,
                add_context_from_internet: !existingText || !existingText.trim(),
                response_json_schema: jsonSchema
            });

            if (result && result[field]) {
                setFormData(prev => ({ ...prev, [field]: result[field] }));
                toast.success(existingText ? 'Текст улучшен!' : 'Контент сгенерирован!');
            }
        } catch (error) {
            console.error(error);
            toast.error('Ошибка генерации контента');
        } finally {
            setGeneratingContent(prev => ({ ...prev, [field]: false }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Parse and normalize tags through AI
        let normalizedTags = [];
        const rawTags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);

        if (rawTags.length > 0) {
            try {
                toast.info('Проверка и оптимизация тегов...');
                const tagsResponse = await base44.functions.invoke('normalizeTags', {
                    tags: rawTags
                });
                if (tagsResponse.data?.normalizedTags) {
                    normalizedTags = tagsResponse.data.normalizedTags;
                    toast.success(`Теги оптимизированы: ${normalizedTags.length} тегов`);
                }
            } catch (error) {
                console.error('Tag normalization error:', error);
                toast.warning('Не удалось оптимизировать теги, используем оригинальные');
                normalizedTags = rawTags;
            }
        }

        // Auto-translate Russian content to English if needed
        let translatedData = { ...formData, tags: normalizedTags };

        const needsTranslation = /[а-яА-ЯёЁ]/.test(formData.description || '') ||
            /[а-яА-ЯёЁ]/.test(formData.insider_tip || '') ||
            /[а-яА-ЯёЁ]/.test(formData.must_try || '') ||
            /[а-яА-ЯёЁ]/.test(formData.opening_hours || '');

        if (needsTranslation) {
            toast.info('Переводим текст на английский...');

            const fieldsToTranslate = [];
            if (formData.description?.trim()) fieldsToTranslate.push({ field: 'description', text: formData.description });
            if (formData.insider_tip?.trim()) fieldsToTranslate.push({ field: 'insider_tip', text: formData.insider_tip });
            if (formData.must_try?.trim()) fieldsToTranslate.push({ field: 'must_try', text: formData.must_try });
            if (formData.opening_hours?.trim()) fieldsToTranslate.push({ field: 'opening_hours', text: formData.opening_hours });

            if (fieldsToTranslate.length > 0) {
                const translationPrompt = `Translate the following location data from Russian to English with a FRIENDLY, CASUAL tone.

TONE REQUIREMENTS:
- Write like a friend sharing a cool spot - warm, enthusiastic, but natural
- Be conversational and relaxed (like chatting over coffee)
- Use simple, genuine language - no over-the-top hype
- Keep it inviting and authentic
- Sound helpful and approachable, not salesy

EXAMPLES OF THE DESIRED TONE:
"Craving solitude? Hit the hidden courtyard for sunny-day zen (warm weather glow-up). Basement's got a no-laptop zone during peak hours—pure unplug magic."
"Birthday bonus at this spot? Free dessert—score! Pro tip: Go wild on the animal desserts; skip the croissants."

Translate these fields:
${fieldsToTranslate.map(f => `${f.field}: "${f.text}"`).join('\n')}

Return format (keep the style fun and lively):
{
  "description": "translated description with humor and personality",
  "insider_tip": "translated tip in casual, fun style", 
  "must_try": "translated recommendation with excitement",
  "opening_hours": "translated opening hours (if provided)"
}`;

                const translation = await base44.integrations.Core.InvokeLLM({
                    prompt: translationPrompt,
                    response_json_schema: {
                        type: "object",
                        properties: {
                            description: { type: "string" },
                            insider_tip: { type: "string" },
                            must_try: { type: "string" },
                            opening_hours: { type: "string" }
                        }
                    }
                });

                translatedData = {
                    ...formData,
                    description_en: translation.description || formData.description,
                    insider_tip_en: translation.insider_tip || formData.insider_tip,
                    must_try_en: translation.must_try || formData.must_try,
                    opening_hours: translation.opening_hours || formData.opening_hours
                };
            }
        }

        // Update main location with first branch coordinates
        const mainBranch = branches[0];
        const submitData = {
            ...translatedData,
            id: location?.id,
            latitude: mainBranch.latitude ? parseFloat(mainBranch.latitude) : null,
            longitude: mainBranch.longitude ? parseFloat(mainBranch.longitude) : null,
            address: mainBranch.address || translatedData.address,
            social_links: translatedData.social_links || [],
            best_time_to_visit: translatedData.best_time_to_visit || [],
            tags: translatedData.tags || []
        };

        // First update/create the location
        onSubmit(submitData);

        // Then create/update branches if location exists
        if (location?.id && branches.length > 0) {
            try {
                // Delete existing branches and create new ones
                const existingBranches = await base44.entities.LocationBranch.filter({ location_id: location.id });
                for (const eb of existingBranches) {
                    await base44.entities.LocationBranch.delete(eb.id);
                }

                // Create new branches
                for (const branch of branches) {
                    if (branch.latitude && branch.longitude) {
                        await base44.entities.LocationBranch.create({
                            location_id: location.id,
                            branch_name: branch.branch_name || (branch.is_main ? 'Главный филиал' : ''),
                            address: branch.address,
                            latitude: parseFloat(branch.latitude),
                            longitude: parseFloat(branch.longitude),
                            phone: branch.phone || '',
                            opening_hours: branch.opening_hours || '',
                            is_main: branch.is_main || false
                        });
                    }
                }
            } catch (error) {
                console.error('Error updating branches:', error);
            }
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Smart Search Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 p-4 rounded-xl border-0 shadow-sm dark:border dark:border-blue-900">
                <Label className="text-neutral-900 dark:text-blue-200 font-semibold mb-2 block flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    Умное заполнение
                </Label>
                <div className="space-y-2">
                    <Input
                        placeholder="Например: Café de Flore, Paris или Roscioli, Rome"
                        value={smartSearchQuery}
                        onChange={(e) => setSmartSearchQuery(e.target.value)}
                        className="bg-white text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 border-blue-200 dark:border-blue-800 focus-visible:ring-blue-500 w-full dark:placeholder:text-neutral-500"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSmartSearch();
                            }
                        }}
                    />
                    <Button
                        type="button"
                        onClick={handleSmartSearch}
                        disabled={isSearching || !smartSearchQuery}
                        className="bg-blue-600 hover:bg-blue-700 text-white w-full"
                    >
                        {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                        Заполнить
                    </Button>
                </div>
                <p className="text-xs text-neutral-900 dark:text-blue-400 mt-2">
                    AI найдет адрес, координаты, сайт, соцсети и описание из Google Maps, Instagram, Facebook и отзывов
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label className="text-neutral-900 dark:text-neutral-300">Название *</Label>
                    <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        className="text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700 dark:placeholder:text-neutral-500"
                    />
                </div>
                <div>
                    <Label className="text-neutral-900 dark:text-neutral-300">Тип</Label>
                    <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                        <SelectTrigger className="text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="cafe">Кафе</SelectItem>
                            <SelectItem value="bar">Бар</SelectItem>
                            <SelectItem value="restaurant">Ресторан</SelectItem>
                            <SelectItem value="market">Рынок</SelectItem>
                            <SelectItem value="shop">Магазин</SelectItem>
                            <SelectItem value="bakery">Пекарня</SelectItem>
                            <SelectItem value="winery">Винодельня</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label className="text-neutral-900 dark:text-neutral-300">Страна *</Label>
                    <Input
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        required
                        className="text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700 dark:placeholder:text-neutral-500"
                    />
                </div>
                <div>
                    <Label className="text-neutral-900 dark:text-neutral-300">Город *</Label>
                    <Input
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        required
                        className="text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700 dark:placeholder:text-neutral-500"
                    />
                </div>
            </div>



            <div>
                <div className="flex items-center justify-between mb-2">
                    <Label className="text-neutral-900 dark:text-neutral-300">Описание</Label>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => generateContent('description')}
                        disabled={generatingContent.description || !formData.name}
                        className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                    >
                        {generatingContent.description ? (
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                            <Sparkles className="w-3 h-3 mr-1" />
                        )}
                        AI генерация
                    </Button>
                </div>
                <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700 dark:placeholder:text-neutral-500"
                />
            </div>

            <div>
                <div className="flex items-center justify-between mb-2">
                    <Label className="text-neutral-900 dark:text-neutral-300">Инсайдерский совет</Label>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => generateContent('insider_tip')}
                        disabled={generatingContent.insider_tip || !formData.name}
                        className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                    >
                        {generatingContent.insider_tip ? (
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                            <Sparkles className="w-3 h-3 mr-1" />
                        )}
                        AI генерация
                    </Button>
                </div>
                <Textarea
                    value={formData.insider_tip}
                    onChange={(e) => setFormData({ ...formData, insider_tip: e.target.value })}
                    rows={2}
                    className="text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700 dark:placeholder:text-neutral-500"
                />
            </div>

            <div>
                <div className="flex items-center justify-between mb-2">
                    <Label className="text-neutral-900 dark:text-neutral-300">Что попробовать</Label>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => generateContent('must_try')}
                        disabled={generatingContent.must_try || !formData.name}
                        className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                    >
                        {generatingContent.must_try ? (
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                            <Sparkles className="w-3 h-3 mr-1" />
                        )}
                        AI генерация
                    </Button>
                </div>
                <Input
                    value={formData.must_try}
                    onChange={(e) => setFormData({ ...formData, must_try: e.target.value })}
                    className="text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700 dark:placeholder:text-neutral-500"
                />
            </div>

            <div className="space-y-4">
                <div>
                    <Label className="text-neutral-900 dark:text-neutral-300">Ценовой диапазон</Label>
                    <Select value={formData.price_range} onValueChange={(v) => setFormData({ ...formData, price_range: v })}>
                        <SelectTrigger className="text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="$">$ - Бюджетно</SelectItem>
                            <SelectItem value="$$">$$ - Средне</SelectItem>
                            <SelectItem value="$$$">$$$ - Дорого</SelectItem>
                            <SelectItem value="$$$$">$$$$ - Премиум</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label className="text-neutral-900 dark:text-neutral-300">Веб-сайт</Label>
                    <Input
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        placeholder="https://example.com"
                        className="text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700 dark:placeholder:text-neutral-500"
                    />
                </div>
                <div>
                    <Label className="text-neutral-900 dark:text-neutral-300">Ссылка для бронирования</Label>
                    <Input
                        value={formData.booking_url}
                        onChange={(e) => setFormData({ ...formData, booking_url: e.target.value })}
                        placeholder="https://booking-link.com"
                        className="text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700 dark:placeholder:text-neutral-500"
                    />
                </div>
            </div>

            <div>
                <Label className="text-neutral-900 dark:text-neutral-300">Изображение</Label>
                <div className="space-y-3">
                    <div className="flex gap-2">
                        <Input
                            value={formData.image_url}
                            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                            placeholder="https://... или загрузите файл ниже"
                            className="text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700 dark:placeholder:text-neutral-500"
                        />
                        {formData.image_url && (
                            <div className="w-10 h-10 rounded-md overflow-hidden shrink-0 border border-stone-200 dark:border-neutral-700">
                                <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;

                                setUploadingImage(true);
                                try {
                                    toast.info('Загрузка изображения...');

                                    const { file_url } = await base44.integrations.Core.UploadFile({ file });

                                    setFormData(prev => ({ ...prev, image_url: file_url }));
                                    toast.success('Фото загружено!');
                                } catch (error) {
                                    console.error(error);
                                    toast.error('Ошибка загрузки фото: ' + (error.message || 'Unknown error'));
                                } finally {
                                    setUploadingImage(false);
                                }
                            }}
                            disabled={uploadingImage}
                            className="flex-1"
                        />
                        {uploadingImage && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
                    </div>
                </div>
            </div>



            <div className="flex gap-6">
                <div className="flex items-center gap-2">
                    <Switch
                        checked={formData.is_hidden_gem}
                        onCheckedChange={(v) => setFormData({ ...formData, is_hidden_gem: v })}
                    />
                    <Label className="text-neutral-900 dark:text-neutral-300">Скрытая жемчужина</Label>
                </div>
                <div className="flex items-center gap-2">
                    <Switch
                        checked={formData.is_featured}
                        onCheckedChange={(v) => setFormData({ ...formData, is_featured: v })}
                    />
                    <Label className="text-neutral-900 dark:text-neutral-300">На главной</Label>
                </div>
            </div>

            {/* Social Links */}
            <div>
                <Label className="text-neutral-900 dark:text-neutral-300">Социальные сети</Label>
                <div className="space-y-2">
                    <div className="flex gap-2">
                        <Input
                            value={socialLinkInput}
                            onChange={(e) => setSocialLinkInput(e.target.value)}
                            placeholder="https://instagram.com/..."
                            className="flex-1 text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700 dark:placeholder:text-neutral-500"
                        />
                        <Button
                            type="button"
                            onClick={() => {
                                if (socialLinkInput.trim() && socialLinkInput.startsWith('http')) {
                                    setFormData({
                                        ...formData,
                                        social_links: [...(formData.social_links || []), socialLinkInput.trim()]
                                    });
                                    setSocialLinkInput('');
                                } else {
                                    toast.error('Введите корректный URL');
                                }
                            }}
                            className="shrink-0"
                        >
                            Добавить
                        </Button>
                    </div>
                    {formData.social_links && formData.social_links.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {formData.social_links.map((link, idx) => (
                                <div key={idx} className="bg-neutral-100 dark:bg-neutral-700 rounded-lg px-3 py-1.5 flex items-center gap-2 text-sm">
                                    <span className="truncate max-w-[200px] dark:text-neutral-100">{link}</span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFormData({
                                                ...formData,
                                                social_links: formData.social_links.filter((_, i) => i !== idx)
                                            });
                                        }}
                                        className="text-neutral-500 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Branches Section */}
            <div className="space-y-4 bg-neutral-50 dark:bg-neutral-900 p-4 rounded-xl">
                <div className="flex items-center justify-between">
                    <Label className="text-neutral-900 dark:text-neutral-300 font-semibold">Филиалы / Адреса</Label>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setBranches([...branches, {
                            id: Date.now(),
                            branch_name: '',
                            address: '',
                            latitude: '',
                            longitude: '',
                            phone: '',
                            opening_hours: '',
                            is_main: false
                        }])}
                        className="text-xs"
                    >
                        + Добавить филиал
                    </Button>
                </div>

                {branches.map((branch, idx) => (
                    <div key={branch.id} className="bg-white dark:bg-neutral-800 p-4 rounded-lg space-y-3 border border-neutral-200 dark:border-neutral-700">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                                {branch.is_main ? '🏢 Главный филиал' : `📍 Филиал ${idx}`}
                            </span>
                            {branches.length > 1 && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setBranches(branches.filter(b => b.id !== branch.id))}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            )}
                        </div>

                        <div className="space-y-2">
                            <div>
                                <Label className="text-xs text-neutral-700 dark:text-neutral-400">Название филиала</Label>
                                <Input
                                    value={branch.branch_name}
                                    onChange={(e) => setBranches(branches.map(b =>
                                        b.id === branch.id ? { ...b, branch_name: e.target.value } : b
                                    ))}
                                    placeholder='Например: "Центральный", "Старый город"'
                                    className="text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700 text-sm"
                                />
                            </div>

                            <div>
                                <Label className="text-xs text-neutral-700 dark:text-neutral-400">Адрес *</Label>
                                <Input
                                    value={branch.address}
                                    onChange={(e) => setBranches(branches.map(b =>
                                        b.id === branch.id ? { ...b, address: e.target.value } : b
                                    ))}
                                    className="text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700 text-sm"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <Label className="text-xs text-neutral-700 dark:text-neutral-400">Телефон</Label>
                                    <Input
                                        value={branch.phone}
                                        onChange={(e) => setBranches(branches.map(b =>
                                            b.id === branch.id ? { ...b, phone: e.target.value } : b
                                        ))}
                                        placeholder="+48..."
                                        className="text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700 text-sm"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs text-neutral-700 dark:text-neutral-400">Часы работы</Label>
                                    <Input
                                        value={branch.opening_hours}
                                        onChange={(e) => setBranches(branches.map(b =>
                                            b.id === branch.id ? { ...b, opening_hours: e.target.value } : b
                                        ))}
                                        placeholder="9:00-22:00"
                                        className="text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700 text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label className="text-xs text-neutral-700 dark:text-neutral-400 mb-1 block">
                                    Координаты (кликните на карте) *
                                </Label>
                                <div className="h-[200px] rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700 relative z-0">
                                    <MapContainer
                                        key={`admin-map-${branch.id}`}
                                        center={branch.latitude && branch.longitude ? [parseFloat(branch.latitude), parseFloat(branch.longitude)] : [48.8566, 2.3522]}
                                        zoom={branch.latitude ? 14 : 2}
                                        style={{ height: '100%', width: '100%' }}
                                    >
                                        <TileLayer
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        />
                                        <LocationPicker
                                            position={branch.latitude && branch.longitude ? [parseFloat(branch.latitude), parseFloat(branch.longitude)] : null}
                                            onLocationSelect={(latlng) => {
                                                setBranches(branches.map(b =>
                                                    b.id === branch.id ? {
                                                        ...b,
                                                        latitude: latlng.lat,
                                                        longitude: latlng.lng
                                                    } : b
                                                ));
                                            }}
                                        />
                                    </MapContainer>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    <Input
                                        type="number"
                                        step="any"
                                        value={branch.latitude}
                                        onChange={(e) => setBranches(branches.map(b =>
                                            b.id === branch.id ? { ...b, latitude: e.target.value } : b
                                        ))}
                                        placeholder="Latitude"
                                        className="font-mono text-xs text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700"
                                    />
                                    <Input
                                        type="number"
                                        step="any"
                                        value={branch.longitude}
                                        onChange={(e) => setBranches(branches.map(b =>
                                            b.id === branch.id ? { ...b, longitude: e.target.value } : b
                                        ))}
                                        placeholder="Longitude"
                                        className="font-mono text-xs text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tags */}
            <div>
                <Label className="text-neutral-900 dark:text-neutral-300">Tags (IMPORTANT for AI recommendations!)</Label>
                <Textarea
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder='Введите через запятую: "specialty coffee, homemade desserts, cozy atmosphere, quiet workspace"'
                    rows={2}
                    className="text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700 dark:placeholder:text-neutral-500"
                />
                <p className="text-xs text-neutral-700 dark:text-neutral-400 mt-1">
                    💡 AI проверит, переведет и оптимизирует теги при сохранении
                </p>
            </div>

            {/* Best Time to Visit */}
            <div>
                <Label className="text-neutral-900 dark:text-neutral-300">Лучшее время для посещения</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                    {['утро', 'день', 'вечер', 'поздняя ночь'].map(time => (
                        <Button
                            key={time}
                            type="button"
                            variant={formData.best_time_to_visit?.includes(time) ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => {
                                const current = formData.best_time_to_visit || [];
                                if (current.includes(time)) {
                                    setFormData({ ...formData, best_time_to_visit: current.filter(t => t !== time) });
                                } else {
                                    setFormData({ ...formData, best_time_to_visit: [...current, time] });
                                }
                            }}
                            className="text-xs"
                        >
                            {time === 'утро' && '☀️ Утро'}
                            {time === 'день' && '🌤️ День'}
                            {time === 'вечер' && '🌆 Вечер'}
                            {time === 'поздняя ночь' && '🌙 Поздняя ночь'}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Special Labels */}
            <div>
                <Label className="text-neutral-900 dark:text-neutral-300">Специальные метки</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                    {['chefCuisine', 'craftCocktails', 'extensiveWineList', 'michelinGuide', 'wineTasting', 'liveMusic', 'allDayBreakfast', 'michelinStar', 'hookahAvailable', 'coworkingSpace', 'rooftopBar', 'localFavorite', 'boardGamesAvailable', 'petFriendly', 'romanticSetting', 'specialtyCoffee', 'cozyRestaurant', 'fusionCuisine', 'streetFood', 'breakfastMenu', 'lunchMenu', 'lateDinner', 'tastyDesserts', 'wheelchairAccessible', 'kidsPlayArea', 'highChairsAvailable', 'outdoorSeating', 'parkingAvailable', 'freeWifi', 'deliveryService', 'takeawayAvailable', 'quietAtmosphere', 'livelyAtmosphere', 'scenicView', 'happyHour', 'veganOptions', 'glutenFreeOptions', 'locallySourcedIngredients'].map(label => (
                        <Button
                            key={label}
                            type="button"
                            variant={formData.special_labels?.includes(label) ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => {
                                const current = formData.special_labels || [];
                                if (current.includes(label)) {
                                    setFormData({ ...formData, special_labels: current.filter(l => l !== label) });
                                } else {
                                    setFormData({ ...formData, special_labels: [...current, label] });
                                }
                            }}
                            className="text-xs"
                        >
                            {label === 'chefCuisine' && 'Авторская кухня'}
                            {label === 'craftCocktails' && 'Авторские коктейли'}
                            {label === 'extensiveWineList' && 'Винная карта'}
                            {label === 'michelinGuide' && 'Гид Мишлен'}
                            {label === 'wineTasting' && 'Дегустация вин'}
                            {label === 'liveMusic' && 'Живая музыка'}
                            {label === 'allDayBreakfast' && 'Завтраки целый день'}
                            {label === 'michelinStar' && 'Звезда Мишлен'}
                            {label === 'hookahAvailable' && 'Кальян'}
                            {label === 'coworkingSpace' && 'Коворкинг'}
                            {label === 'rooftopBar' && 'Крышная терраса'}
                            {label === 'localFavorite' && 'Любимое у местных'}
                            {label === 'boardGamesAvailable' && 'Настольные игры'}
                            {label === 'petFriendly' && 'Pet Friendly'}
                            {label === 'romanticSetting' && 'Романтическая атмосфера'}
                            {label === 'specialtyCoffee' && 'Specialty Coffee'}
                            {label === 'cozyRestaurant' && 'Уютно'}
                            {label === 'fusionCuisine' && 'Фьюжн'}
                            {label === 'streetFood' && 'Стрит-фуд'}
                            {label === 'breakfastMenu' && 'Меню завтраков'}
                            {label === 'lunchMenu' && 'Меню ланча'}
                            {label === 'lateDinner' && 'Поздний ужин'}
                            {label === 'tastyDesserts' && 'Вкусные десерты'}
                            {label === 'wheelchairAccessible' && 'Для инвалидных колясок'}
                            {label === 'kidsPlayArea' && 'Детская игровая зона'}
                            {label === 'highChairsAvailable' && 'Детские стульчики'}
                            {label === 'outdoorSeating' && 'Открытая веранда'}
                            {label === 'parkingAvailable' && 'Парковка'}
                            {label === 'freeWifi' && 'Wi-Fi'}
                            {label === 'deliveryService' && 'Доставка'}
                            {label === 'takeawayAvailable' && 'Самовывоз'}
                            {label === 'quietAtmosphere' && 'Тихая атмосфера'}
                            {label === 'livelyAtmosphere' && 'Оживленная атмосфера'}
                            {label === 'scenicView' && 'Живописный вид'}
                            {label === 'happyHour' && 'Счастливые часы'}
                            {label === 'veganOptions' && 'Веганские блюда'}
                            {label === 'glutenFreeOptions' && 'Безглютеновые'}
                            {label === 'locallySourcedIngredients' && 'Местные продукты'}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={isLoading}>
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Сохранить
                </Button>
                {location?.status === 'pending' && (
                    <Button
                        type="button"
                        onClick={async () => {
                            await onSubmit({
                                ...formData,
                                id: location?.id,
                                latitude: formData.latitude ? parseFloat(formData.latitude) : null,
                                longitude: formData.longitude ? parseFloat(formData.longitude) : null,
                                status: 'published'
                            });
                        }}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        disabled={isLoading}
                    >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Сохранить и опубликовать
                    </Button>
                )}
            </div>
        </form>
    );
}

function FeedbackDetail({ feedback, onStatusChange, onClose }) {
    if (!feedback) return null;

    const copyEmail = () => {
        navigator.clipboard.writeText(feedback.user_email);
        toast.success('Email скопирован');
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label className="text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wider">Пользователь</Label>
                    <div className="font-medium text-lg mt-1 text-neutral-900 dark:text-neutral-100">{feedback.user_name}</div>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-neutral-900 dark:text-neutral-300 select-all">{feedback.user_email}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyEmail} title="Скопировать email">
                            <Copy className="w-3 h-3" />
                        </Button>
                    </div>
                </div>
                <div className="text-right">
                    <Label className="text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wider">Детали</Label>
                    <div className="mt-2 flex flex-col items-end gap-2">
                        <Badge variant="outline" className={
                            feedback.type === 'bug' ? 'bg-red-50 text-red-700 border-red-200' :
                                feedback.type === 'feature' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                    feedback.type === 'partnership' ? 'bg-purple-50 text-purple-700 border-purple-200' : ''
                        }>
                            {feedback.type === 'bug' ? 'Ошибка' :
                                feedback.type === 'feature' ? 'Идея' :
                                    feedback.type === 'partnership' ? 'Партнёрство' : 'Вопрос'}
                        </Badge>
                        <span className="text-xs text-neutral-500 dark:text-neutral-500">
                            {feedback.created_date && format(new Date(feedback.created_date), 'dd.MM.yyyy HH:mm')}
                        </span>
                    </div>
                </div>
            </div>

            <div>
                <Label className="text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wider mb-2 block">Сообщение</Label>
                <div className="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-xl border-0 shadow-sm dark:border dark:border-neutral-700 text-sm leading-relaxed whitespace-pre-wrap max-h-[300px] overflow-y-auto text-neutral-900 dark:text-neutral-100">
                    {feedback.message}
                </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-neutral-700">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">Статус:</span>
                    <Badge className={
                        feedback.status === 'new' ? 'bg-amber-500' :
                            feedback.status === 'in_progress' ? 'bg-blue-500' :
                                feedback.status === 'resolved' ? 'bg-green-500' : 'bg-stone-500'
                    }>
                        {feedback.status === 'new' ? 'Новое' :
                            feedback.status === 'in_progress' ? 'В работе' :
                                feedback.status === 'resolved' ? 'Решено' : 'Архив'}
                    </Badge>
                </div>
                <div className="flex gap-2">
                    {feedback.status !== 'resolved' && (
                        <Button
                            variant="outline"
                            className="text-green-600 border-green-200 hover:bg-green-50"
                            onClick={() => {
                                onStatusChange(feedback.id, 'resolved');
                                onClose();
                            }}
                        >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Отметить решенным
                        </Button>
                    )}
                    {feedback.status !== 'archived' && (
                        <Button
                            variant="ghost"
                            onClick={() => {
                                onStatusChange(feedback.id, 'archived');
                                onClose();
                            }}
                        >
                            <Archive className="w-4 h-4 mr-2" />
                            В архив
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}