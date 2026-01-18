import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { api } from '@/api/client';
import { Loader2, MessageSquarePlus } from "lucide-react";
import { useLanguage } from '../LanguageContext';

export default function FeedbackModal({ isOpen, onOpenChange, user }) {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [type, setType] = useState('general');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        setLoading(true);
        try {
            await api.entities.Feedback.create({
                user_email: user?.email || 'anonymous',
                user_name: user?.full_name || 'Anonymous',
                message: message.trim(),
                type,
                status: 'new'
            });
            toast.success(t('feedbackThanks') || 'Спасибо за ваш отзыв!');
            setMessage('');
            setType('general');
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast.error(t('feedbackError') || 'Ошибка при отправке');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] dark:bg-neutral-800 dark:border-neutral-700">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
                        <MessageSquarePlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        {t('feedback') || 'Обратная связь'}
                    </DialogTitle>
                    <DialogDescription className="text-neutral-700 dark:text-neutral-400">
                        {t('feedbackDescription') || 'Поделитесь вашими идеями, сообщите об ошибке или просто напишите нам.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label className="text-neutral-900 dark:text-neutral-300">{t('feedbackType') || 'Тип обращения'}</Label>
                        <Select value={type} onValueChange={setType}>
                            <SelectTrigger className="text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="general">{t('feedbackGeneral') || 'Общий вопрос'}</SelectItem>
                                <SelectItem value="bug">{t('feedbackBug') || 'Сообщить об ошибке'}</SelectItem>
                                <SelectItem value="feature">{t('feedbackFeature') || 'Предложить идею'}</SelectItem>
                                <SelectItem value="partnership">{t('feedbackPartnership') || 'Сотрудничество'}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-neutral-900 dark:text-neutral-300">{t('feedbackMessage') || 'Сообщение'}</Label>
                        <Textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder={t('feedbackPlaceholder') || 'Ваше сообщение...'}
                            className="min-h-[120px] text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700 dark:placeholder:text-neutral-500"
                            required
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading || !message.trim()} className="w-full sm:w-auto">
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {t('feedbackSubmit') || 'Отправить'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}