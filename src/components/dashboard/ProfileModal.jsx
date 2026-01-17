import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Bell, CreditCard, Trash2, Loader2, Upload, Camera, X } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function ProfileModal({ isOpen, onOpenChange, user }) {
    const [formData, setFormData] = useState({
        full_name: user?.full_name || '',
        bio: user?.bio || '',
        avatar_url: user?.avatar_url || ''
    });
    const [notificationSettings, setNotificationSettings] = useState({
        email_notifications: true,
        new_locations: true,
        location_updates: true,
        marketing: false,
        ...user?.notification_settings
    });
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [deletionRequested, setDeletionRequested] = useState(false);
    
    const queryClient = useQueryClient();

    const { data: subscriptions = [] } = useQuery({
        queryKey: ['userSubscriptions', user?.email],
        queryFn: () => base44.entities.Subscription.filter({ user_email: user.email }),
        enabled: !!user && isOpen
    });

    const updateProfileMutation = useMutation({
        mutationFn: (data) => base44.auth.updateMe(data),
        onSuccess: () => {
            toast.success('Профиль обновлен');
            queryClient.invalidateQueries(['user']);
        }
    });

    const handleAvatarUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingAvatar(true);
        try {
            const { file_url } = await base44.integrations.Core.UploadFile({ file });
            setFormData({ ...formData, avatar_url: file_url });
            await updateProfileMutation.mutateAsync({ avatar_url: file_url });
        } catch (error) {
            console.error(error);
            toast.error('Ошибка загрузки аватара');
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleSaveProfile = async () => {
        try {
            await updateProfileMutation.mutateAsync({
                full_name: formData.full_name,
                bio: formData.bio,
                avatar_url: formData.avatar_url
            });
        } catch (error) {
            console.error(error);
            toast.error('Ошибка сохранения профиля');
        }
    };

    const handleSaveNotifications = async () => {
        try {
            await updateProfileMutation.mutateAsync({
                notification_settings: notificationSettings
            });
            toast.success('Настройки уведомлений сохранены');
        } catch (error) {
            console.error(error);
            toast.error('Ошибка сохранения настроек');
        }
    };

    const handleRequestDeletion = async () => {
        if (!confirm('Вы уверены, что хотите запросить удаление всех своих данных? Это действие необратимо.')) {
            return;
        }

        try {
            await base44.entities.Feedback.create({
                user_email: user.email,
                user_name: user.full_name,
                type: 'general',
                message: `GDPR: Запрос на удаление всех данных пользователя ${user.email}. Дата запроса: ${new Date().toISOString()}`,
                status: 'new'
            });
            setDeletionRequested(true);
            toast.success('Запрос на удаление данных отправлен. Мы обработаем его в течение 30 дней.');
        } catch (error) {
            console.error(error);
            toast.error('Ошибка отправки запроса');
        }
    };

    const getStatusBadge = (status) => {
        const colors = {
            active: 'bg-green-100 text-green-700',
            expired: 'bg-red-100 text-red-700',
            cancelled: 'bg-neutral-100 text-neutral-700'
        };
        const labels = {
            active: 'Активна',
            expired: 'Истекла',
            cancelled: 'Отменена'
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`}>
                {labels[status]}
            </span>
        );
    };

    const getPlanLabel = (plan) => {
        const labels = {
            monthly: 'Месячная',
            yearly: 'Годовая',
            lifetime: 'Пожизненная'
        };
        return labels[plan] || plan;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto overflow-x-hidden p-0 gap-0 sm:rounded-3xl w-[95vw]">
                <DialogHeader className="px-6 pt-6 pb-3 border-b border-neutral-100 sticky top-0 bg-white z-10">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-2xl font-bold">Мой профиль</DialogTitle>
                        <button 
                            onClick={() => onOpenChange(false)}
                            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-neutral-100 transition-colors"
                            aria-label="Закрыть"
                        >
                            <X className="w-5 h-5 text-neutral-500" />
                        </button>
                    </div>
                </DialogHeader>

                <Tabs defaultValue="profile" className="w-full overflow-x-hidden">
                    <TabsList className="w-full grid grid-cols-2 md:grid-cols-4 gap-1.5 px-3 py-2 bg-transparent border-b border-neutral-100 rounded-none h-auto">
                        <TabsTrigger 
                            value="profile"
                            className="flex flex-col md:flex-row items-center justify-center gap-0.5 md:gap-1.5 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 rounded-lg py-2 transition-all"
                        >
                            <User className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            <span className="text-[10px] md:text-xs font-medium">Профиль</span>
                        </TabsTrigger>
                        <TabsTrigger 
                            value="notifications"
                            className="flex flex-col md:flex-row items-center justify-center gap-0.5 md:gap-1.5 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 rounded-lg py-2 transition-all"
                        >
                            <Bell className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            <span className="text-[10px] md:text-xs font-medium">Уведомления</span>
                        </TabsTrigger>
                        <TabsTrigger 
                            value="subscriptions"
                            className="flex flex-col md:flex-row items-center justify-center gap-0.5 md:gap-1.5 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 rounded-lg py-2 transition-all"
                        >
                            <CreditCard className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            <span className="text-[10px] md:text-xs font-medium">Подписки</span>
                        </TabsTrigger>
                        <TabsTrigger 
                            value="privacy"
                            className="flex flex-col md:flex-row items-center justify-center gap-0.5 md:gap-1.5 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 rounded-lg py-2 transition-all"
                        >
                            <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            <span className="text-[10px] md:text-xs font-medium">Данные</span>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="profile" className="px-4 md:px-6 py-6 space-y-6 overflow-x-hidden">
                        {/* Avatar Section */}
                        <div className="flex flex-col items-center gap-4 py-4">
                            <div className="relative">
                                {formData.avatar_url ? (
                                    <img 
                                        src={formData.avatar_url} 
                                        alt="Аватар пользователя"
                                        className="w-28 h-28 md:w-32 md:h-32 rounded-full object-cover border-4 border-white shadow-lg ring-2 ring-blue-100"
                                    />
                                ) : (
                                    <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center border-4 border-white shadow-lg ring-2 ring-blue-100">
                                        <User className="w-14 h-14 md:w-16 md:h-16 text-neutral-400" />
                                    </div>
                                )}
                                <label className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl active:scale-95">
                                    {uploadingAvatar ? (
                                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                                    ) : (
                                        <Camera className="w-5 h-5 text-white" />
                                    )}
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        className="hidden" 
                                        onChange={handleAvatarUpload}
                                        disabled={uploadingAvatar}
                                    />
                                </label>
                            </div>
                            <p className="text-sm text-neutral-500 text-center px-4">Нажмите на иконку для загрузки фото</p>
                        </div>

                        {/* Profile Form */}
                        <div className="space-y-4 overflow-hidden">
                            <div className="bg-neutral-50 rounded-2xl p-4 overflow-hidden">
                                <Label className="text-xs text-neutral-500 mb-2">Email</Label>
                                <p className="font-medium text-neutral-900 break-all">{user?.email || ''}</p>
                                <p className="text-xs text-neutral-400 mt-1">Email нельзя изменить</p>
                            </div>

                            <div>
                                <Label className="mb-2">Имя</Label>
                                <Input 
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    placeholder="Ваше имя"
                                    className="h-12 rounded-xl"
                                />
                            </div>

                            <div>
                                <Label className="mb-2">О себе</Label>
                                <Textarea 
                                    value={formData.bio}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                    placeholder="Расскажите о себе..."
                                    rows={3}
                                    className="rounded-xl"
                                />
                            </div>

                            <div className="bg-neutral-50 rounded-2xl p-4 overflow-hidden">
                                <Label className="text-xs text-neutral-500 mb-2">Роль</Label>
                                <p className="font-medium text-neutral-900 break-words">
                                    {user?.role === 'admin' ? 'Администратор' : user?.role === 'creator' ? 'Креатор' : 'Пользователь'}
                                </p>
                            </div>

                            <Button 
                                onClick={handleSaveProfile}
                                disabled={updateProfileMutation.isPending}
                                className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 font-medium text-sm px-3"
                            >
                                {updateProfileMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin shrink-0" />
                                ) : null}
                                <span className="truncate">Сохранить изменения</span>
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="notifications" className="px-4 md:px-6 py-6 space-y-4 overflow-x-hidden">
                        <div className="space-y-4">
                            <div className="bg-white rounded-2xl p-4 border border-neutral-100 shadow-sm">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex-1 min-w-0 overflow-hidden">
                                        <Label className="font-semibold text-neutral-900 block truncate">Email уведомления</Label>
                                        <p className="text-xs md:text-sm text-neutral-500 mt-1">Получать уведомления на email</p>
                                    </div>
                                    <Switch
                                        checked={notificationSettings.email_notifications}
                                        onCheckedChange={(checked) => 
                                            setNotificationSettings({ ...notificationSettings, email_notifications: checked })
                                        }
                                    />
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl p-4 border border-neutral-100 shadow-sm">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex-1 min-w-0 overflow-hidden">
                                        <Label className="font-semibold text-neutral-900 block truncate">Новые локации</Label>
                                        <p className="text-xs md:text-sm text-neutral-500 mt-1">Уведомления о новых местах</p>
                                    </div>
                                    <Switch
                                        checked={notificationSettings.new_locations}
                                        onCheckedChange={(checked) => 
                                            setNotificationSettings({ ...notificationSettings, new_locations: checked })
                                        }
                                    />
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl p-4 border border-neutral-100 shadow-sm">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex-1 min-w-0 overflow-hidden">
                                        <Label className="font-semibold text-neutral-900 block truncate">Обновления локаций</Label>
                                        <p className="text-xs md:text-sm text-neutral-500 mt-1 break-words">Уведомления об изменениях в сохраненных местах</p>
                                    </div>
                                    <Switch
                                        checked={notificationSettings.location_updates}
                                        onCheckedChange={(checked) => 
                                            setNotificationSettings({ ...notificationSettings, location_updates: checked })
                                        }
                                    />
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl p-4 border border-neutral-100 shadow-sm">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex-1 min-w-0 overflow-hidden">
                                        <Label className="font-semibold text-neutral-900 block truncate">Маркетинг</Label>
                                        <p className="text-xs md:text-sm text-neutral-500 mt-1">Специальные предложения и новости</p>
                                    </div>
                                    <Switch
                                        checked={notificationSettings.marketing}
                                        onCheckedChange={(checked) => 
                                            setNotificationSettings({ ...notificationSettings, marketing: checked })
                                        }
                                    />
                                </div>
                            </div>

                            <Button 
                                onClick={handleSaveNotifications}
                                disabled={updateProfileMutation.isPending}
                                className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 font-medium text-sm mt-6 px-3"
                            >
                                <span className="truncate">Сохранить настройки</span>
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="subscriptions" className="px-4 md:px-6 py-6 overflow-x-hidden">
                        {subscriptions.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CreditCard className="w-10 h-10 text-neutral-300" />
                                </div>
                                <p className="text-neutral-500 font-medium">У вас пока нет подписок</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {subscriptions.map((sub) => (
                                    <div key={sub.id} className="bg-white rounded-2xl p-5 border border-neutral-100 shadow-sm space-y-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0 overflow-hidden">
                                                <p className="font-bold text-lg text-neutral-900 truncate">{getPlanLabel(sub.plan)}</p>
                                                <p className="text-sm text-neutral-500 mt-1 break-words">
                                                    {new Date(sub.start_date).toLocaleDateString('ru-RU')} - {new Date(sub.end_date).toLocaleDateString('ru-RU')}
                                                </p>
                                            </div>
                                            {getStatusBadge(sub.status)}
                                        </div>
                                        {sub.amount_paid && (
                                            <div className="pt-3 border-t border-neutral-100">
                                                <p className="text-sm text-neutral-600">
                                                    Оплачено: <span className="font-bold text-blue-600">${sub.amount_paid}</span>
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="privacy" className="px-4 md:px-6 py-6 space-y-4 overflow-x-hidden">
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 md:p-6 border border-amber-100 shadow-sm overflow-hidden">
                            <div className="flex items-start gap-2 md:gap-3">
                                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                                    <Trash2 className="w-5 h-5 text-amber-600" />
                                </div>
                                <div className="flex-1 min-w-0 overflow-hidden">
                                    <h3 className="font-bold text-amber-900 mb-2 break-words">Удаление данных (GDPR)</h3>
                                    <p className="text-sm text-amber-800 leading-relaxed mb-3 break-words">
                                        В соответствии с GDPR, вы имеете право запросить удаление всех ваших персональных данных. 
                                        После подтверждения запроса, мы удалим все ваши данные в течение 30 дней.
                                    </p>
                                    <p className="text-xs text-amber-700 mb-4 break-words">
                                        Будут удалены: аккаунт, сохраненные локации, заметки, отзывы и вся связанная информация.
                                    </p>
                                    {deletionRequested ? (
                                        <div className="bg-green-100 border border-green-200 rounded-xl p-3">
                                            <p className="text-xs md:text-sm text-green-800 font-medium break-words">
                                                ✓ Запрос на удаление данных отправлен. Мы обработаем его в течение 30 дней.
                                            </p>
                                        </div>
                                    ) : (
                                        <Button
                                            variant="destructive"
                                            onClick={handleRequestDeletion}
                                            className="w-full h-11 rounded-xl font-medium text-xs md:text-sm px-3"
                                        >
                                            <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 shrink-0" />
                                            <span className="truncate">Запросить удаление данных</span>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 md:p-6 border border-blue-100 shadow-sm overflow-hidden">
                            <div className="flex items-start gap-2 md:gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                                    <Upload className="w-5 h-5 text-blue-600" />
                                </div>
                                <div className="flex-1 min-w-0 overflow-hidden">
                                    <h3 className="font-bold text-blue-900 mb-2 break-words">Экспорт данных</h3>
                                    <p className="text-sm text-blue-800 leading-relaxed mb-4 break-words">
                                        Вы можете запросить копию всех ваших данных в машиночитаемом формате.
                                    </p>
                                    <Button
                                        variant="outline"
                                        onClick={() => toast.info('Экспорт данных будет доступен в следующей версии')}
                                        className="w-full h-11 rounded-xl border-blue-200 hover:bg-blue-100 hover:border-blue-300 font-medium text-xs md:text-sm px-3"
                                    >
                                        <Upload className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 shrink-0" />
                                        <span className="truncate">Экспортировать мои данные</span>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}