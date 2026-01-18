import React, { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Star, Shield, Zap } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useLanguage } from '../components/LanguageContext';

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

export default function Pricing() {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [hasActiveSub, setHasActiveSub] = useState(false);
    const [checkingSubscription, setCheckingSubscription] = useState(true);

    useEffect(() => {
        const checkUserAndSubscription = async () => {
            try {
                const userData = await api.auth.me();
                setUser(userData);

                // Check for active subscription
                const subs = await api.entities.Subscription.filter({
                    user_email: userData.email,
                    status: 'active'
                });

                // Validate if subscription is not expired
                const now = new Date();
                const validSub = subs.find(sub => new Date(sub.end_date) >= now);

                if (validSub) {
                    setHasActiveSub(true);
                }
            } catch (e) {
                // User not logged in
            } finally {
                setCheckingSubscription(false);
            }
        };

        checkUserAndSubscription();
    }, []);

    const handlePurchase = async (plan) => {
        if (!user) {
            // Force login before purchase
            toast.info("Please sign in first");
            api.auth.redirectToLogin(window.location.href);
            return;
        }

        setLoading(true);
        try {
            const startDate = new Date();
            let endDate = new Date();

            if (plan.id === 'monthly') endDate.setMonth(endDate.getMonth() + 1);
            else if (plan.id === 'yearly') endDate.setFullYear(endDate.getFullYear() + 1);
            else endDate.setFullYear(endDate.getFullYear() + 100);

            await api.entities.Subscription.create({
                user_email: user.email,
                plan: plan.id,
                status: 'active',
                start_date: startDate.toISOString().split('T')[0],
                end_date: endDate.toISOString().split('T')[0],
                amount_paid: plan.price
            });

            toast.success('Subscription active! Redirecting to dashboard...');
            // Redirect to Dashboard immediately after purchase
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
        <>
            <style dangerouslySetInnerHTML={{
                __html: `
                    /* Isolated reset for public page - Pricing */
                    #root, #root > * {
                        isolation: isolate;
                    }
                    html {
                        background: #F2F2F7 !important;
                        overflow-x: hidden;
                    }
                    body {
                        background: #F2F2F7 !important;
                        overflow-x: hidden;
                        min-height: 100dvh;
                    }
                    /* Fix for iOS Safari */
                    @supports (-webkit-touch-callout: none) {
                        html {
                            height: -webkit-fill-available;
                        }
                        body {
                            min-height: -webkit-fill-available;
                        }
                    }
                `
            }} />

            <div className="fixed inset-0 bg-[#F2F2F7]" style={{ zIndex: -1 }} />

            <div className="min-h-[100dvh] relative isolate py-20 px-6 font-sans">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-8">
                        <div>
                            <Link to={user ? createPageUrl("Dashboard") : createPageUrl("Home")} className="text-sm font-medium text-neutral-500 hover:text-neutral-900 mb-4 inline-block">
                                ← {user ? 'Dashboard' : 'Home'}
                            </Link>
                            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-neutral-900 mb-4">
                                Invest in your <br />
                                <span className="text-blue-600">experiences</span>
                            </h1>
                            <p className="text-lg text-neutral-500 max-w-md">
                                We are in <strong>Free Beta</strong>. Enjoy all features for free while we grow!
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-3xl shadow-sm max-w-xs hidden md:block">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                    <Shield className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="font-semibold text-sm">Money-back guarantee</p>
                                    <p className="text-xs text-neutral-500">14 days to decide</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    <Zap className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="font-semibold text-sm">Instant Access</p>
                                    <p className="text-xs text-neutral-500">Right after payment</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {plans.map((plan, idx) => (
                            <motion.div
                                key={plan.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className={`relative rounded-[2.5rem] p-8 flex flex-col justify-between h-full ${plan.color} ${plan.textColor} shadow-xl shadow-neutral-200/50 border border-neutral-100 ${hasActiveSub ? 'opacity-60' : ''}`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-4 left-8 bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg shadow-blue-500/30">
                                        {t('mostPopular')}
                                    </div>
                                )}

                                <div>
                                    <div className="mb-8">
                                        <h3 className="font-medium text-lg opacity-80 mb-1">{plan.name}</h3>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-4xl font-bold">${plan.price}</span>
                                            <span className="opacity-60 text-sm">{plan.period}</span>
                                        </div>
                                        <p className="mt-4 text-sm opacity-70 leading-relaxed">
                                            {plan.description}
                                        </p>
                                    </div>

                                    <div className="space-y-4 mb-8">
                                        {plan.features.map((feature, i) => (
                                            <div key={i} className="flex items-center gap-3">
                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${plan.id === 'yearly' ? 'bg-white/20' : plan.id === 'lifetime' ? 'bg-white/20' : 'bg-neutral-100'}`}>
                                                    <Check className="w-3 h-3" />
                                                </div>
                                                <span className="text-sm font-medium opacity-90">{feature}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {hasActiveSub ? (
                                    <div className="w-full h-14 rounded-2xl text-base font-semibold flex items-center justify-center bg-green-500 text-white">
                                        <Check className="w-5 h-5 mr-2" />
                                        Active Subscription
                                    </div>
                                ) : (
                                    <Button
                                        onClick={() => handlePurchase(plan)}
                                        disabled={loading || checkingSubscription}
                                        className={`w-full h-14 rounded-2xl text-base font-semibold transition-transform active:scale-95 ${plan.id === 'yearly'
                                            ? 'bg-white text-black hover:bg-neutral-200'
                                            : plan.id === 'lifetime'
                                                ? 'bg-white text-blue-600 hover:bg-blue-50'
                                                : 'bg-neutral-900 text-white hover:bg-neutral-800'
                                            }`}
                                    >
                                        {loading ? 'Processing...' : checkingSubscription ? 'Checking...' : 'Choose Plan'}
                                    </Button>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}