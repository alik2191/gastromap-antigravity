import React, { useState } from 'react';
import { api } from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Image as ImageIcon, Trash2, ExternalLink, Copy, Upload,
    RefreshCw, Loader2, FileText, MoreVertical
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const BUCKETS = [
    { id: 'uploads', name: 'Uploads (General)' },
    { id: 'avatars', name: 'Avatars' },
    { id: 'location-images', name: 'Locations' }, // Assuming these exist, if not, list default will handle empty
];

export default function MediaLibraryTab() {
    const [selectedBucket, setSelectedBucket] = useState('uploads');
    const [viewMode, setViewMode] = useState('grid');
    const [uploading, setUploading] = useState(false);
    const queryClient = useQueryClient();

    // Fetch Files
    const { data: files = [], isLoading, refetch } = useQuery({
        queryKey: ['storage-files', selectedBucket],
        queryFn: async () => {
            try {
                const data = await api.storage.list(selectedBucket);
                // Add public URL to each file
                return data.map(file => ({
                    ...file,
                    publicUrl: api.storage.getPublicUrl(file.name, selectedBucket)
                }));
            } catch (error) {
                console.error("Bucket fetch error:", error);
                // If bucket doesn't exist, generic error usually
                return [];
            }
        }
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: async (fileName) => {
            await api.storage.remove([fileName], selectedBucket);
        },
        onSuccess: () => {
            toast.success('Файл удален');
            queryClient.invalidateQueries(['storage-files', selectedBucket]);
        },
        onError: (error) => {
            toast.error('Ошибка удаления: ' + error.message);
        }
    });

    const handleUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
            await api.storage.upload(fileName, file, selectedBucket);
            toast.success('Файл загружен');
            refetch();
        } catch (error) {
            console.error(error);
            toast.error('Ошибка загрузки');
        } finally {
            setUploading(false);
        }
    };

    const copyUrl = (url) => {
        navigator.clipboard.writeText(url);
        toast.success('URL скопирован');
    };

    return (
        <div className="space-y-4 h-full flex flex-col">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <Select value={selectedBucket} onValueChange={setSelectedBucket}>
                        <SelectTrigger className="w-[200px] bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700">
                            <SelectValue placeholder="Выберите бакет" />
                        </SelectTrigger>
                        <SelectContent>
                            {BUCKETS.map(b => (
                                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="flex items-center gap-2 border-l border-neutral-200 dark:border-neutral-700 pl-4">
                        <Button
                            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                            size="icon"
                            onClick={() => setViewMode('grid')}
                            className="h-8 w-8"
                        >
                            <ImageIcon className="w-4 h-4" />
                        </Button>
                        <Button
                            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                            size="icon"
                            onClick={() => setViewMode('list')}
                            className="h-8 w-8"
                        >
                            <FileText className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto">
                    <div className="relative">
                        <input
                            type="file"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={handleUpload}
                            disabled={uploading}
                        />
                        <Button disabled={uploading} className="gap-2">
                            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                            Загрузить файл
                        </Button>
                    </div>
                    <Button variant="outline" size="icon" onClick={() => refetch()}>
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {/* Content Area */}
            <Card className="flex-1 overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-sm bg-stone-50/50 dark:bg-neutral-900/50">
                <div className="h-full overflow-auto p-4">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-40">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        </div>
                    ) : files.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-neutral-500">
                            <ImageIcon className="w-12 h-12 mb-4 opacity-20" />
                            <p>Нет файлов в этом бакете</p>
                        </div>
                    ) : viewMode === 'grid' ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {files.map(file => (
                                <div key={file.id || file.name} className="group relative bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden aspect-square hover:shadow-md transition-all">
                                    <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="secondary" size="icon" className="h-6 w-6 rounded-full bg-white/90 backdrop-blur shadow-sm">
                                                    <MoreVertical className="w-3 h-3" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => copyUrl(file.publicUrl)}>
                                                    <Copy className="w-3 h-3 mr-2" /> Копировать URL
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => window.open(file.publicUrl, '_blank')}>
                                                    <ExternalLink className="w-3 h-3 mr-2" /> Открыть
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => deleteMutation.mutate(file.name)} className="text-red-600 hover:text-red-700 hover:bg-red-50 focus:bg-red-50">
                                                    <Trash2 className="w-3 h-3 mr-2" /> Удалить
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    <div className="w-full h-full flex items-center justify-center p-2">
                                        {file.metadata?.mimetype?.startsWith('image/') || file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                            <img
                                                src={file.publicUrl}
                                                alt={file.name}
                                                className="w-full h-full object-cover rounded-md"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 text-neutral-400">
                                                <FileText className="w-8 h-8" />
                                                <span className="text-[10px] truncate max-w-[90%]">{file.name.split('.').pop()}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 pt-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <p className="text-xs text-white truncate font-medium">{file.name}</p>
                                        <p className="text-[10px] text-white/80">
                                            {format(new Date(file.created_at), 'dd.MM.yyyy')}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {files.map(file => (
                                <div key={file.id || file.name} className="flex items-center justify-between p-3 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-lg group hover:border-blue-200 dark:hover:border-blue-900 transition-all">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="w-10 h-10 shrink-0 bg-neutral-100 dark:bg-neutral-800 rounded-md flex items-center justify-center overflow-hidden">
                                            {file.metadata?.mimetype?.startsWith('image/') || file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                                <img src={file.publicUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <FileText className="w-5 h-5 text-neutral-400" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">{file.name}</p>
                                            <p className="text-xs text-neutral-500">
                                                {(file.metadata?.size / 1024).toFixed(1)} KB • {format(new Date(file.created_at), 'dd.MM.yyyy HH:mm')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyUrl(file.publicUrl)}>
                                            <Copy className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => deleteMutation.mutate(file.name)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}
