import React from 'react';
import { MapPin, Eye, RefreshCw, MessageSquare, Star, Lock, Sparkles, Route, Trophy, Calendar, Smartphone, Languages } from "lucide-react";
import { motion } from 'framer-motion';

const features = [
    {
        icon: Sparkles,
        title: "AI Guide",
        description: "Smart assistant remembers your preferences, plans routes, and adds events to your calendar.",
        color: "bg-purple-100 text-purple-600"
    },
    {
        icon: Trophy,
        title: "Achievements",
        description: "Unlock rewards as you explore. Track cities, countries, and discover hidden gems.",
        color: "bg-amber-100 text-amber-600"
    },
    {
        icon: Route,
        title: "Route Planning",
        description: "Build custom walking routes with multiple stops — perfect for food tours.",
        color: "bg-blue-100 text-blue-600"
    },
    {
        icon: Eye,
        title: "Hidden Gems",
        description: "Places you won't find in regular guidebooks. Only local secrets.",
        color: "bg-teal-100 text-teal-600"
    },
    {
        icon: Star,
        title: "Personalized Feed",
        description: "Get recommendations based on your saved places and taste preferences.",
        color: "bg-rose-100 text-rose-600"
    },
    {
        icon: Calendar,
        title: "Calendar Integration",
        description: "Export your plans directly to Google Calendar, iCal, or Outlook.",
        color: "bg-green-100 text-green-600"
    },
    {
        icon: Smartphone,
        title: "Mobile Optimized",
        description: "Fast, responsive web app that works seamlessly on any device, anywhere.",
        color: "bg-indigo-100 text-indigo-600"
    },
    {
        icon: Languages,
        title: "Multilingual",
        description: "Available in multiple languages — explore the world in your native tongue.",
        color: "bg-pink-100 text-pink-600"
    },
    {
        icon: Lock,
        title: "Exclusive Access",
        description: "Subscribers only — no ads and mass tourism.",
        color: "bg-neutral-100 text-neutral-600"
    }
];

function FeatureCard({ feature, index }) {
    return (
        <div className="group relative p-6 md:p-8 bg-white rounded-[1.5rem] md:rounded-[2rem] border border-neutral-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 h-full"
        >
            <div className={`w-12 h-12 md:w-14 md:h-14 ${feature.color} rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6`}>
                <feature.icon className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-3 tracking-tight">
                {feature.title}
            </h3>
            <p className="text-neutral-500 leading-relaxed font-medium">
                {feature.description}
            </p>
        </div>
    );
}

export default function FeaturesSection() {
    return (
        <section className="py-32 px-6 relative overflow-hidden font-sans">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12 md:mb-20 px-2">
                    <motion.h2 
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-3xl md:text-6xl font-semibold tracking-tight mb-4 md:mb-6 leading-tight"
                    >
                        <span className="text-neutral-900">More than just a </span>
                        <span className="text-blue-600">guide.</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-neutral-900 max-w-2xl mx-auto text-base md:text-xl font-medium leading-relaxed"
                    >
                        AI-powered recommendations, gamification, offline support, and multilingual access — everything you need for perfect food discoveries.
                    </motion.p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                        >
                            <FeatureCard feature={feature} index={index} />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}