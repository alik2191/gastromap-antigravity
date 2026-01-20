import React, { useState, useEffect, useRef } from 'react';

import { api } from '@/api/client'; // MOCK DATA
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
    FileSpreadsheet, Download, Upload, MoreVertical, AlertTriangle,
    ChevronLeft, ChevronRight, X, BarChart3, Eye, EyeOff, LayoutDashboard, Terminal, ImageIcon, Bell, Settings, Info, Building2
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
import SmartFillDialog from '../components/admin/SmartFillDialog';

import BulkEditor from '../components/admin/BulkEditor';
import InviteUserDialog from '../components/admin/InviteUserDialog';
import ReviewDetail from '../components/admin/ReviewDetail';
import CreatorModerationTab from '../components/admin/CreatorModerationTab';
import ModerationLocationsTab from '../components/admin/ModerationLocationsTab';
import AIManagementTab from '../components/admin/AIManagementTab';
import CreatorLocationEditForm from '@/components/admin/CreatorLocationEditForm';
import SystemLogsTab from '@/components/admin/SystemLogsTab';
import DashboardTab from '@/components/admin/DashboardTab';
import NewDashboardTab from '@/components/admin/NewDashboardTab';
import MediaLibraryTab from '@/components/admin/MediaLibraryTab';
import { useAuth } from '@/lib/AuthContext';
import AdminLayout from '@/components/admin/AdminLayout';
import AIAgentStatusCard from '@/components/admin/AIAgentStatusCard';
import FeedbackDetail from '@/components/admin/FeedbackDetail';
import LocationForm from '@/components/admin/LocationForm';
import SubscriptionForm from '@/components/admin/SubscriptionForm';

import MobileCardList from '@/components/ui/MobileCardList';

export default function Admin() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard'); // Changed default to dashboard
    const [showLocationForm, setShowLocationForm] = useState(false);
    const [editingLocation, setEditingLocation] = useState(null);
    const [showInviteDialog, setShowInviteDialog] = useState(false);
    const [showSubscriptionForm, setShowSubscriptionForm] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCountry, setFilterCountry] = useState('all');
    const [filterCity, setFilterCity] = useState('all');
    const [filterPrice, setFilterPrice] = useState('all');
    const [sortBy, setSortBy] = useState('updated_at'); // updated_date or created_date
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
                const response = await api.functions.invoke('importLocations', { locations: data });

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

            const response = await api.functions.invoke('importLocations', { locations: data });
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
        let successCount = 0;
        let failedCount = 0;

        try {
            const lines = bulkImportText
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0);

            if (lines.length === 0) {
                toast.error('Список пуст');
                setIsBulkImporting(false);
                return;
            }

            toast.info(`Обрабатываю ${lines.length} локаций... Пожалуйста, подождите.`);

            // Process sequentially to avoid overwhelming the client/network
            for (const line of lines) {
                try {
                    // Simple parsing: Assumes the line IS the name.
                    // Can be improved later if format is "Name | Address" etc.
                    const locationData = {
                        name: line,
                        country: bulkImportCountry,
                        city: bulkImportCity,
                        status: 'pending', // Send to moderation
                        type: 'cafe', // Default type
                        generated_description: 'Imported via Bulk Tool'
                    };

                    await api.entities.Location.create(locationData);
                    successCount++;
                } catch (err) {
                    console.error('Failed to import line:', line, err);
                    failedCount++;
                }
            }

            if (successCount > 0) {
                toast.success(`Успешно добавлено ${successCount} локаций на модерацию!`);
                queryClient.invalidateQueries(['admin-pending-locations']);
            }

            if (failedCount > 0) {
                toast.warning(`Не удалось обработать ${failedCount} локаций`);
            }

            setShowBulkImport(false);
            setBulkImportText('');
            setBulkImportCountry('');
            setBulkImportCity('');
        } catch (error) {
            console.error(error);
            toast.error('Ошибка массового импорта: ' + error.message);
        } finally {
            setIsBulkImporting(false);
        }
    };

    const checkAdmin = async () => {
        try {
            const userData = await api.auth.me();
            if (!userData || (userData.role !== 'admin' && userData.custom_role !== 'admin')) {
                toast.error('Доступ запрещен: требуется роль администратора');
                navigate(createPageUrl('Dashboard'));
                return;
            }
            setUser(userData);
        } catch (e) {
            console.error('Admin check failed:', e);
            navigate(api.auth.getLoginUrl(window.location.pathname));
            return;
        }
        setLoading(false);
    };

    useEffect(() => {
        checkAdmin();
    }, []);

    const { data: locations = [] } = useQuery({
        queryKey: ['admin-locations'],
        queryFn: async () => {
            const allLocations = await api.entities.Location.list();
            return allLocations.filter(l => l.status === 'published' || !l.status);
        },
        enabled: !loading
    });

    const { data: pendingLocations = [] } = useQuery({
        queryKey: ['admin-pending-locations'],
        queryFn: async () => {
            const allLocations = await api.entities.Location.list('-created_at');
            return allLocations.filter(l => l.status === 'pending');
        },
        enabled: !loading
    });

    const { data: subscriptions = [] } = useQuery({
        queryKey: ['admin-subscriptions'],
        queryFn: () => api.entities.Subscription.list('-created_at'),
        enabled: !loading,
        refetchInterval: 60000 // Poll every minute
    });

    const { data: users = [] } = useQuery({
        queryKey: ['admin-users'],
        queryFn: () => api.entities.User.list(),
        enabled: !loading
    });

    const { data: feedback = [] } = useQuery({
        queryKey: ['admin-feedback'],
        queryFn: () => api.entities.Feedback.list('-created_at'),
        enabled: !loading,
        refetchInterval: 30000 // Poll every 30 seconds
    });

    const { data: regionStatuses = [] } = useQuery({
        queryKey: ['admin-region-statuses'],
        queryFn: () => api.entities.RegionStatus.list(),
        enabled: !loading
    });

    const { data: reviews = [] } = useQuery({
        queryKey: ['admin-reviews'],
        queryFn: () => api.entities.Review.list('-created_at'),
        enabled: !loading,
        refetchInterval: 30000
    });

    const { data: agentConversations = [] } = useQuery({
        queryKey: ['agent-conversations'],
        queryFn: () => api.agents.listConversations({ agent_name: 'location_manager' }),
        enabled: !loading
    });

    const { data: moderationRounds = [] } = useQuery({
        queryKey: ['admin-moderation-rounds'],
        queryFn: async () => {
            const allRounds = await api.entities.ModerationRound.filter({ status: 'pending_admin_review' });
            // Only AI-generated rounds (not creator voting rounds)
            return allRounds.filter(round =>
                (round.yes_count === 0 || !round.yes_count) &&
                (round.no_count === 0 || !round.no_count)
            );
        },
        enabled: !loading,
        refetchInterval: 30000
    });

    const { data: aiAgents = [], isLoading: loadingAgents } = useQuery({
        queryKey: ['admin-ai-agents'],
        queryFn: async () => {
            try {
                return await api.entities.AIAgent.list();
            } catch (error) {
                console.error('Error loading AI agents:', error);
                return [];
            }
        },
        enabled: !loading
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
                api.entities.Subscription.update(sub.id, { status: 'expired' }).catch(console.error);
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
                return api.entities.Location.update(data.id, data);
            }
            return api.entities.Location.create(data);
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
            return api.entities.Location.update(id, { status: 'published' });
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
            return api.entities.Location.update(id, { status: 'rejected' });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-locations']);
            queryClient.invalidateQueries(['admin-pending-locations']);
            toast.success('Локация отклонена');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => api.entities.Location.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-locations']);
            toast.success('Локация удалена');
        }
    });

    const subscriptionMutation = useMutation({
        mutationFn: ({ id, status }) => api.entities.Subscription.update(id, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-subscriptions']);
            toast.success('Статус обновлён');
        }
    });

    const feedbackMutation = useMutation({
        mutationFn: ({ id, status }) => api.entities.Feedback.update(id, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-feedback']);
            toast.success('Статус обновлён');
        }
    });

    const reviewMutation = useMutation({
        mutationFn: ({ id, status, is_hidden }) => api.entities.Review.update(id, { status, is_hidden }),
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-reviews']);
            queryClient.invalidateQueries(['analytics-reviews']);
            toast.success('Статус отзыва обновлён');
        }
    });

    const updateUserRoleMutation = useMutation({
        mutationFn: ({ id, custom_role }) => api.entities.User.update(id, { custom_role }),
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
                return api.entities.RegionStatus.update(existing.id, updateData);
            }
            return api.entities.RegionStatus.create({
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
        mutationFn: (data) => api.entities.Subscription.create(data),
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

    const formattedFeedback = feedback.map(item => ({
        ...item,
        user_name: item.user_name || 'Аноним',
        user_email: item.user_email || 'N/A'
    }));

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F2F2F7] dark:bg-black flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            </div>
        );
    }

    return (
        <AdminLayout
            activeTab={activeTab}
            onTabChange={setActiveTab}
            user={user}
            onLogout={() => {
                api.auth.logout();
                navigate(createPageUrl('Login'));
            }}
            fabAction={activeTab === 'locations' ? {
                icon: <Plus className="w-6 h-6" />,
                onClick: () => {
                    setEditingLocation(null);
                    setShowLocationForm(true);
                }
            } : null}
        >
            {/* Mobile Menu (Settings Tab) */}
            {activeTab === 'settings' && (
                <div className="grid grid-cols-2 gap-4 p-4 animate-in fade-in slide-in-from-bottom-4">
                    {[
                        { id: 'users', label: 'Пользователи', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
                        { id: 'reviews', label: 'Отзывы', icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
                        { id: 'feedback', label: 'Обращения', icon: MessageSquare, color: 'text-green-500', bg: 'bg-green-50' },
                        { id: 'subscriptions', label: 'Подписки', icon: CreditCard, color: 'text-purple-500', bg: 'bg-purple-50' },
                        { id: 'analytics', label: 'Аналитика', icon: BarChart3, color: 'text-indigo-500', bg: 'bg-indigo-50' },
                        { id: 'system-logs', label: 'Логи', icon: Terminal, color: 'text-gray-500', bg: 'bg-gray-50' },
                        { id: 'media', label: 'Медиатека', icon: ImageIcon, color: 'text-pink-500', bg: 'bg-pink-50' },
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className="flex flex-col items-center justify-center p-6 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 shadow-sm active:scale-95 transition-all"
                        >
                            <div className={`w-12 h-12 rounded-full ${item.bg} flex items-center justify-center mb-3`}>
                                <item.icon className={`w-6 h-6 ${item.color}`} />
                            </div>
                            <span className="font-medium text-neutral-900 dark:text-neutral-100">{item.label}</span>
                        </button>
                    ))}
                </div>
            )}
            {activeTab === 'dashboard' && (
                <div className="space-y-4">
                    <NewDashboardTab
                        onAddLocation={() => {
                            setEditingLocation(null);
                            setShowLocationForm(true);
                        }}
                        onInviteUser={() => setShowInviteDialog(true)}
                        onSwitchTab={(tab) => setActiveTab(tab)}
                        onOpenSettings={() => setActiveTab('settings')}
                    />
                </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
                <AnalyticsTab />
            )}

            {/* Locations Tab - Import/Export */}
            {activeTab === 'locations' && (
                <>
                    <ImportWizard
                        isOpen={showImportWizard}
                        onClose={() => {
                            setShowImportWizard(false);
                            setImportFile(null);
                        }}
                        file={importFile}
                        type={importType}
                        onImported={() => {
                            queryClient.invalidateQueries(['admin-locations']);
                            toast.success('Локации успешно импортированы!');
                        }}
                    />

                    <Card className="shadow-sm border-0 dark:bg-neutral-800 dark:border dark:border-neutral-700">
                        <CardHeader>
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <CardTitle className="text-neutral-900 dark:text-neutral-100">Импорт/Экспорт локаций</CardTitle>
                                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                                        Загрузите локации из файла или экспортируйте текущие данные
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        onClick={() => {
                                            const input = document.createElement('input');
                                            input.type = 'file';
                                            input.accept = '.csv,.xlsx';
                                            input.onchange = (e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    setImportFile(file);
                                                    setImportType(file.name.endsWith('.xlsx') ? 'xlsx' : 'csv');
                                                    setShowImportWizard(true);
                                                }
                                            };
                                            input.click();
                                        }}
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        <Upload className="w-4 h-4 mr-2" />
                                        Импорт
                                    </Button>

                                    <Button
                                        onClick={handleExport}
                                        variant="outline"
                                        disabled={!locations || locations.length === 0}
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Экспорт CSV
                                    </Button>
                                    <Button
                                        onClick={handleExportExcel}
                                        variant="outline"
                                        disabled={!locations || locations.length === 0}
                                    >
                                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                                        Экспорт Excel
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {/* Info Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-4 text-neutral-900 dark:text-neutral-100">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                                                <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                                                    {locations?.length || 0}
                                                </p>
                                                <p className="text-xs text-blue-600 dark:text-blue-400">Всего локаций</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                                                <Globe className="w-5 h-5 text-green-600 dark:text-green-400" />
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                                                    {availableCountries?.length || 0}
                                                </p>
                                                <p className="text-xs text-green-600 dark:text-green-400">Стран</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 rounded-lg p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                                                <Building2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                                                    {availableCities?.length || 0}
                                                </p>
                                                <p className="text-xs text-purple-600 dark:text-purple-400">Городов</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Instructions */}
                                <div className="bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
                                    <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-3 flex items-center gap-2">
                                        <Info className="w-4 h-4" />
                                        Инструкция по импорту
                                    </h4>
                                    <div className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                                        <p><strong className="text-neutral-900 dark:text-neutral-200">Формат файла:</strong> CSV или Excel (.xlsx)</p>
                                        <p><strong className="text-neutral-900 dark:text-neutral-200">Обязательные поля:</strong> name, type, country, city, latitude, longitude</p>
                                        <p><strong className="text-neutral-900 dark:text-neutral-200">Дополнительные поля:</strong> address, description, price_range, website, image_url, is_hidden_gem, is_featured, insider_tip, must_try</p>
                                        <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                                            <p className="text-xs">
                                                💡 <strong>Совет:</strong> Экспортируйте текущие данные, чтобы увидеть правильный формат для импорта
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Dialog for creating new locations */}
                    <Dialog open={showLocationForm && !editingLocation} onOpenChange={(open) => {
                        if (!open) {
                            setShowLocationForm(false);
                            setEditingLocation(null);
                        }
                    }}>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto dark:bg-neutral-800 dark:border-neutral-700">
                            <DialogHeader>
                                <DialogTitle className="text-neutral-900 dark:text-neutral-100">
                                    Добавить новую локацию
                                </DialogTitle>
                            </DialogHeader>
                            <LocationForm
                                location={null}
                                onSubmit={(data) => locationMutation.mutate(data)}
                                isLoading={locationMutation.isPending}
                            />
                        </DialogContent>
                    </Dialog>
                </>
            )}

            {/* Creator Moderation Tab */}
            {
                activeTab === 'creator-moderation' && (
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
                )
            }

            {/* Modals */}
            <InviteUserDialog
                open={showInviteDialog}
                onOpenChange={setShowInviteDialog}
            />

            {/* Moderation Tab */}
            {
                activeTab === 'moderation' && (
                    <>
                        <Dialog open={showLocationForm && editingLocation?.status === 'pending'
                        } onOpenChange={(open) => {
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
                        </Dialog >

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
                                                <TableHead className="text-right w-[200px]">Действия</TableHead>
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
                                                            {location.created_at && format(new Date(location.created_at), 'dd.MM.yyyy HH:mm')}
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
                    </>
                )
            }

            {/* Reviews Tab */}
            {
                activeTab === 'reviews' && (
                    <>
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
                                                            {review.created_at && format(new Date(review.created_at), 'dd.MM.yyyy HH:mm')}
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
                                                                    <Badge variant="outline" className="bg-neutral-100 dark:bg-black text-neutral-900 dark:text-neutral-300 text-[10px]">
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
                                                    <span>{review.created_at && format(new Date(review.created_at), 'dd.MM HH:mm')}</span>
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
                    </>
                )
            }

            {/* Subscriptions Tab */}
            {
                activeTab === 'subscriptions' && (
                    <>
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
                                {/* Mobile List View */}
                                <div className="md:hidden p-4 bg-neutral-50/50 dark:bg-black/20">
                                    <MobileCardList
                                        data={subscriptions}
                                        renderItem={(sub) => (
                                            <Card className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-sm">
                                                <CardContent className="p-4 space-y-3">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <div className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">{sub.user_email}</div>
                                                            <div className="flex gap-2 mt-1">
                                                                <Badge variant="outline" className="text-[10px] h-5">{sub.plan}</Badge>
                                                                <Badge className={`text-[10px] h-5 ${sub.status === 'active' ? 'bg-green-500' :
                                                                    sub.status === 'expired' ? 'bg-stone-500' : 'bg-red-500'
                                                                    }`}>
                                                                    {sub.status}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                        <div className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                                                            ${sub.amount_paid?.toLocaleString()}
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between text-xs text-neutral-500 pt-2">
                                                        <span>Start: {sub.start_date && format(new Date(sub.start_date), 'dd.MM')}</span>
                                                        <span>End: {sub.end_date && format(new Date(sub.end_date), 'dd.MM')}</span>
                                                    </div>
                                                    <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
                                                        <Select
                                                            value={sub.status}
                                                            onValueChange={(status) => subscriptionMutation.mutate({ id: sub.id, status })}
                                                        >
                                                            <SelectTrigger className="w-full h-8 text-xs">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="active">Active</SelectItem>
                                                                <SelectItem value="expired">Expired</SelectItem>
                                                                <SelectItem value="cancelled">Cancelled</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )}
                                    />
                                </div>

                                <div className="hidden md:block overflow-x-auto">
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
                    </>
                )
            }

            {/* Users Tab */}
            {
                activeTab === 'users' && (
                    <Card className="shadow-sm border-0 dark:bg-neutral-800 dark:border dark:border-neutral-700">
                        <CardHeader>
                            <CardTitle className="text-neutral-900 dark:text-neutral-100">Пользователи</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {/* Mobile List View */}
                            <div className="md:hidden p-4 bg-neutral-50/50 dark:bg-black/20">
                                <MobileCardList
                                    data={users}
                                    renderItem={(u) => {
                                        const userSub = subscriptions.find(s => s.user_email === u.email && s.status === 'active');
                                        return (
                                            <Card className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-sm">
                                                <CardContent className="p-4 space-y-3">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <div className="font-semibold text-neutral-900 dark:text-neutral-100">{u.full_name}</div>
                                                            <div className="text-xs text-neutral-500">{u.email}</div>
                                                        </div>
                                                        <Badge variant={(u.role === 'admin' || u.custom_role === 'admin') ? 'default' : (u.custom_role === 'creator' ? 'outline' : 'secondary')}>
                                                            {u.custom_role || u.role}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex justify-between items-center text-xs">
                                                        <div className="text-neutral-500">
                                                            Since: {u.created_at ? format(new Date(u.created_at), 'dd.MM.yyyy') : '-'}
                                                        </div>
                                                        {userSub ? (
                                                            <Badge className="bg-green-500 h-5 px-1.5">{userSub.plan}</Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="h-5 px-1.5 text-neutral-400">No Sub</Badge>
                                                        )}
                                                    </div>
                                                    <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800">
                                                        <Select
                                                            value={u.custom_role || u.role}
                                                            onValueChange={(custom_role) => updateUserRoleMutation.mutate({ id: u.id, custom_role })}
                                                        >
                                                            <SelectTrigger className="w-full h-8 text-xs">
                                                                <SelectValue placeholder="Role" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="user">User</SelectItem>
                                                                <SelectItem value="creator">Creator</SelectItem>
                                                                <SelectItem value="admin">Admin</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    }}
                                />
                            </div>

                            <div className="hidden md:block overflow-x-auto">
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
                                                        {u.created_at && format(new Date(u.created_at), 'dd.MM.yyyy')}
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
                )
            }

            {/* AI Management Tab */}
            {
                activeTab === 'ai-management' && (
                    <AIManagementTab />
                )
            }

            {/* Feedback Tab */}
            {
                activeTab === 'feedback' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">User Feedback</h2>
                        </div>

                        <div className="grid gap-4">
                            {formattedFeedback.map((item) => (
                                <div key={item.id} className="bg-white dark:bg-black p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 flex justify-between items-start cursor-pointer hover:shadow-md transition-all" onClick={() => setSelectedFeedback(item)}>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge variant="outline" className={
                                                item.type === 'bug' ? 'bg-red-50 text-red-700 border-red-200' :
                                                    item.type === 'feature' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                        item.type === 'partnership' ? 'bg-purple-50 text-purple-700 border-purple-200' : ''
                                            }>
                                                {item.type === 'bug' ? 'Ошибка' :
                                                    item.type === 'feature' ? 'Идея' :
                                                        item.type === 'partnership' ? 'Партнёрство' : 'Вопрос'}
                                            </Badge>
                                            <span className="font-semibold text-neutral-900 dark:text-neutral-100">{item.user_name}</span>
                                            <span className="text-sm text-neutral-500">{item.user_email}</span>
                                        </div>
                                        <p className="text-neutral-600 dark:text-neutral-300 line-clamp-2">{item.message}</p>
                                        <span className="text-xs text-neutral-400 mt-2 block">{item.created_at ? format(new Date(item.created_at), 'dd.MM.yyyy HH:mm') : 'N/A'}</span>
                                    </div>
                                    <Badge className={
                                        item.status === 'new' ? 'bg-amber-500' :
                                            item.status === 'in_progress' ? 'bg-blue-500' :
                                                item.status === 'resolved' ? 'bg-green-500' : 'bg-stone-500'
                                    }>
                                        {item.status === 'new' ? 'Новое' :
                                            item.status === 'in_progress' ? 'В работе' :
                                                item.status === 'resolved' ? 'Решено' : 'Архив'}
                                    </Badge>
                                </div>
                            ))}
                            {feedback.length === 0 && (
                                <div className="text-center p-8 text-neutral-500">
                                    Запросов пока нет
                                </div>
                            )}
                        </div>
                    </div>
                )
            }

            {
                activeTab === 'system-logs' && (
                    <div className="h-[calc(100vh-200px)]">
                        <SystemLogsTab />
                    </div>
                )
            }

            {
                activeTab === 'media' && (
                    <div className="h-[calc(100vh-200px)]">
                        <MediaLibraryTab />
                    </div>
                )
            }

            {/* Bulk Editor */}
            < BulkEditor
                isOpen={showBulkEditor}
                onOpenChange={setShowBulkEditor}
                rows={filteredLocations}
                onSaved={() => {
                    setShowBulkEditor(false);
                    queryClient.invalidateQueries(['admin-locations']);
                    queryClient.invalidateQueries(['admin-pending-locations']);
                }
                }
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

        </AdminLayout >
    );
}
