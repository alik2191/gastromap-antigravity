import React from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { CheckCircle2, X, Star, Eye, EyeOff, Copy } from "lucide-react";

export default function ReviewDetail({ review, onStatusChange, onClose }) {
    if (!review) return null;

    const copyEmail = () => {
        navigator.clipboard.writeText(review.user_email);
        toast.success('Email скопирован');
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label className="text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wider">Пользователь</Label>
                    <div className="font-medium text-lg mt-1 text-neutral-900 dark:text-neutral-100">{review.user_name}</div>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-neutral-900 dark:text-neutral-300 select-all">{review.user_email}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyEmail} title="Скопировать email">
                            <Copy className="w-3 h-3" />
                        </Button>
                    </div>
                </div>
                <div className="text-right">
                    <Label className="text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wider">Детали</Label>
                    <div className="mt-2 flex flex-col items-end gap-2">
                        <Badge variant="outline">
                            Отзыв
                        </Badge>
                        <span className="text-xs text-neutral-500 dark:text-neutral-500">
                            {review.created_at && format(new Date(review.created_at), 'dd.MM.yyyy HH:mm')}
                        </span>
                    </div>
                </div>
            </div>

            <div>
                <Label className="text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wider mb-2 block">Локация ID</Label>
                <p className="font-medium text-sm mt-1 font-mono text-neutral-900 dark:text-neutral-300">{review.location_id}</p>
            </div>

            <div>
                <Label className="text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wider mb-2 block">Рейтинг</Label>
                <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-300 dark:text-neutral-600'}`} />
                    ))}
                </div>
            </div>

            {review.comment && (
                <div>
                    <Label className="text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wider mb-2 block">Комментарий</Label>
                    <div className="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-xl border-0 shadow-sm dark:border dark:border-neutral-700 text-sm leading-relaxed whitespace-pre-wrap max-h-[300px] overflow-y-auto text-neutral-900 dark:text-neutral-100">
                        {review.comment}
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-neutral-700">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">Статус:</span>
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
                        <Badge variant="outline" className="ml-2 bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-300">
                            Скрыто
                        </Badge>
                    )}
                </div>
                <div className="flex gap-2 flex-wrap justify-end">
                    {review.status !== 'approved' && (
                        <Button 
                            variant="outline" 
                            size="sm"
                            className="text-green-600 border-green-200 hover:bg-green-50"
                            onClick={() => {
                                onStatusChange(review.id, 'approved', false);
                                onClose();
                            }}
                        >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Одобрить
                        </Button>
                    )}
                    {review.status !== 'rejected' && (
                        <Button 
                            variant="outline" 
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => {
                                onStatusChange(review.id, 'rejected', true);
                                onClose();
                            }}
                        >
                            <X className="w-4 h-4 mr-2" />
                            Отклонить
                        </Button>
                    )}
                    <Button 
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            onStatusChange(review.id, review.status, !review.is_hidden);
                            onClose();
                        }}
                    >
                        {review.is_hidden ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
                        {review.is_hidden ? 'Показать' : 'Скрыть'}
                    </Button>
                </div>
            </div>
        </div>
    );
}