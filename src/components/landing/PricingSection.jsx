import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Check, Sparkles, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from '@/api/client';
import { toast } from "sonner";
import { motion } from 'framer-motion';

const plans = [
    {
        id: "monthly",
        name: "Monthly",
        price: 9.99,
        period: "/mo",
        description: "For short trips",
        features: ["Access to all locations", "Save to favorites", "Basic recommendations"],
        color: "bg-white",
        textColor: "text-neutral-900",
        buttonVariant: "outline"
    },
    {
        id: "yearly",
        name: "Yearly",
        price: 49.99,
        period: "/yr",
        description: "Traveler's choice",
        features: ["Everything in Monthly", "AI assistant 24/7", "Offline maps", "Exclusive guides"],
        popular: true,
        color: "bg-neutral-900",
        textColor: "text-white",
        buttonVariant: "default"
    },
    {
        id: "lifetime",
        name: "Lifetime",
        price: 149.99,
        period: " forever",
        description: "One-time payment",
        features: ["Full unlimited access", "VIP support", "Early feature access", "Private community"],
        color: "bg-blue-600",
        textColor: "text-white",
        buttonVariant: "secondary"
    }
];

function PricingCard({ plan, index, onPurchase, loading }) {
    return (
        <div className={`relative rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 flex flex-col justify-between h-full ${plan.color} ${plan.textColor} shadow-xl shadow-neutral-200/50 border border-neutral-100 min-h-[450px] md:min-h-[500px] group hover:-translate-y-2 transition-transform duration-300`}
        >
            {plan.popular && (
                <div className="absolute -top-4 left-8 bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg shadow-blue-500/30">
                    MOST POPULAR
                </div>
            )}

            <div>
                <div className="mb-8">
                    <h3 className="font-medium text-lg opacity-80 mb-1">{plan.name}</h3>
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold">${plan.price}</span>
                        <span className="opacity-60 text-sm">{plan.period}</span>
                    </div>
                    <p className="mt-4 text-sm opacity-70 leading-relaxed font-medium">
                        {plan.description}
                    </p>
                </div>

                <div className="space-y-3 md:space-y-4 mb-6 md:mb-8">
                    {plan.features.map((feature, i) => (
                        <div key={i} className="flex items-start gap-3">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${plan.color === 'bg-white' ? 'bg-neutral-100' : 'bg-white/20'}`}>
                                <Check className="w-3 h-3" />
                            </div>
                            <span className="text-sm font-medium opacity-90 leading-tight">{feature}</span>
                        </div>
                    ))}
                </div>
            </div>

            <Button
                onClick={() => onPurchase(plan)}
                disabled={loading}
                className={`w-full h-14 rounded-2xl text-base font-semibold transition-transform active:scale-95 ${plan.name === 'Yearly'
                    ? 'bg-white text-black hover:bg-neutral-200'
                    : plan.name === 'Lifetime'
                        ? 'bg-white text-blue-600 hover:bg-blue-50'
                        : 'bg-neutral-900 text-white hover:bg-neutral-800'
                    }`}
            >
                {loading ? 'Processing...' : 'Get Free Access'}
            </Button>
        </div>
    );
}

export default function PricingSection() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        base44.auth.me().then(setUser).catch(() => { });
    }, []);

    const handlePurchase = async (plan) => {
        if (!user) {
            toast.info("Please sign in first");
            base44.auth.redirectToLogin(window.location.href);
            return;
        }

        setLoading(true);
        try {
            const startDate = new Date();
            let endDate = new Date();

            if (plan.id === 'monthly') endDate.setMonth(endDate.getMonth() + 1);
            else if (plan.id === 'yearly') endDate.setFullYear(endDate.getFullYear() + 1);
            else endDate.setFullYear(endDate.getFullYear() + 100);

            await base44.entities.Subscription.create({
                user_email: user.email,
                plan: plan.id,
                status: 'active',
                start_date: startDate.toISOString().split('T')[0],
                end_date: endDate.toISOString().split('T')[0],
                amount_paid: plan.price
            });

            toast.success('Subscription active! Redirecting...');
            setTimeout(() => {
                navigate(createPageUrl('Dashboard'));
            }, 1000);

        } catch (e) {
            toast.error('Purchase error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section id="pricing" className="py-32 px-6 relative overflow-hidden font-sans">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12 md:mb-20 px-2">
                    <motion.h2
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-3xl md:text-6xl font-semibold tracking-tight mb-4 md:mb-6 leading-tight"
                    >
                        <span className="text-neutral-900">Invest in </span>
                        <span className="text-blue-600">experiences.</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-neutral-900 max-w-2xl mx-auto text-base md:text-xl font-medium leading-relaxed"
                    >
                        We are currently in <strong>Free Beta</strong>. Get full access for free while we grow.
                    </motion.p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {plans.map((plan, index) => (
                        <PricingCard
                            key={index}
                            plan={plan}
                            index={index}
                            onPurchase={handlePurchase}
                            loading={loading}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}