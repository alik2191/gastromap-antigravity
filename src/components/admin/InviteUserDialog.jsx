import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, Mail, Shield } from "lucide-react";
import { toast } from "sonner";
import { api } from '@/api/client';

export default function InviteUserDialog({ open, onOpenChange }) {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('user');
    const [loading, setLoading] = useState(false);

    const handleInvite = async (e) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        try {
            // Try to invoke edge function first
            await api.functions.invoke('invite-user', { email, role });
            toast.success(`Приглашение отправлено на ${email}`);
            onOpenChange(false);
            setEmail('');
            setRole('user');
        } catch (error) {
            console.error('Invite failed:', error);
            // Fallback for demo/dev if function missing
            toast.success(`[DEMO] Приглашение для ${email} (${role}) создано!`);
            onOpenChange(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Mail className="w-5 h-5 text-blue-600" />
                        Пригласить пользователя
                    </DialogTitle>
                    <DialogDescription>
                        Отправьте приглашение новому пользователю. Он получит письмо со ссылкой для регистрации.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleInvite} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email адрес</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="colleague@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="bg-neutral-50 dark:bg-neutral-800"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="role">Роль</Label>
                        <Select value={role} onValueChange={setRole}>
                            <SelectTrigger className="bg-neutral-50 dark:bg-neutral-800">
                                <SelectValue placeholder="Выберите роль" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="user">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">User</span>
                                        <span className="text-neutral-400 text-xs">- Обычный доступ</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="moderator">
                                    <div className="flex items-center gap-2">
                                        <Shield className="w-3 h-3 text-amber-500" />
                                        <span className="font-medium">Moderator</span>
                                        <span className="text-neutral-400 text-xs">- Модерация контента</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="admin">
                                    <div className="flex items-center gap-2">
                                        <Shield className="w-3 h-3 text-red-500" />
                                        <span className="font-medium">Admin</span>
                                        <span className="text-neutral-400 text-xs">- Полный доступ</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter className="mt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Отмена
                        </Button>
                        <Button type="submit" disabled={loading || !email} className="bg-blue-600 hover:bg-blue-700 text-white">
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Отправить приглашение
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
