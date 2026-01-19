import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function SubscriptionForm({ onSubmit, isLoading, subscription }) {
    const [formData, setFormData] = useState({
        user_email: '',
        plan_id: 'pro_monthly',
        status: 'active',
        start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        amount_paid: 19.99,
        payment_method: 'manual',
    });

    const plans = [
        { id: 'pro_monthly', name: 'Pro Monthly ($19.99)', price: 19.99, months: 1 },
        { id: 'pro_yearly', name: 'Pro Yearly ($199.99)', price: 199.99, months: 12 },
        { id: 'business_monthly', name: 'Business Monthly ($49.99)', price: 49.99, months: 1 },
    ];

    const handlePlanChange = (planId) => {
        const plan = plans.find(p => p.id === planId);
        if (plan) {
            setFormData({
                ...formData,
                plan_id: planId,
                amount_paid: plan.price,
                end_date: format(new Date(Date.now() + plan.months * 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
            });
        }
    };

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4">
            <div>
                <Label>Email пользователя</Label>
                <Input
                    required
                    type="email"
                    value={formData.user_email}
                    onChange={(e) => setFormData({ ...formData, user_email: e.target.value })}
                />
            </div>

            <div>
                <Label>Тарифный план</Label>
                <Select value={formData.plan_id} onValueChange={handlePlanChange}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {plans.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label>Дата начала</Label>
                    <Input
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    />
                </div>
                <div>
                    <Label>Дата окончания</Label>
                    <Input
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                </div>
            </div>

            <div>
                <Label>Оплаченная сумма ($)</Label>
                <Input
                    type="number"
                    value={formData.amount_paid}
                    onChange={(e) => setFormData({ ...formData, amount_paid: parseFloat(e.target.value) })}
                />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading || !formData.user_email}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Создать подписку
            </Button>
        </form>
    );
}
