import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { CheckCircle2, Archive, MessageSquare } from "lucide-react";

export default function FeedbackDetail({ feedback, onStatusChange, onClose }) {
    if (!feedback) return null;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <Badge variant="outline" className={
                        feedback.type === 'bug' ? 'bg-red-50 text-red-700 border-red-200' :
                            feedback.type === 'feature' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                feedback.type === 'partnership' ? 'bg-purple-50 text-purple-700 border-purple-200' : ''
                    }>
                        {feedback.type === 'bug' ? 'Ошибка' :
                            feedback.type === 'feature' ? 'Идея' :
                                feedback.type === 'partnership' ? 'Партнёрство' : 'Вопрос'}
                    </Badge>
                    <h3 className="text-xl font-bold mt-2 text-neutral-900 dark:text-neutral-100">{feedback.subject || 'Без темы'}</h3>
                    <p className="text-sm text-neutral-500">
                        {feedback.created_at ? format(new Date(feedback.created_at), 'dd MMMM yyyy HH:mm') : 'N/A'}
                    </p>
                </div>
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

            <div className="bg-stone-50 dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-neutral-200 dark:border-neutral-800">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <p className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">{feedback.user_name || 'Аноним'}</p>
                        <p className="text-xs text-neutral-500">{feedback.user_email || 'N/A'}</p>
                    </div>
                </div>
                <p className="whitespace-pre-wrap text-neutral-700 dark:text-neutral-300 text-sm leading-relaxed">
                    {feedback.message}
                </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                <Button variant="outline" onClick={onClose}>
                    Закрыть
                </Button>
                {feedback.status !== 'resolved' && (
                    <Button onClick={() => onStatusChange(feedback.id, 'resolved')} className="bg-green-600 hover:bg-green-700 text-white gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Отметить решенным
                    </Button>
                )}
                {feedback.status !== 'archived' && (
                    <Button variant="secondary" onClick={() => onStatusChange(feedback.id, 'archived')} className="gap-2">
                        <Archive className="w-4 h-4" />
                        В архив
                    </Button>
                )}
            </div>
        </div>
    );
}
