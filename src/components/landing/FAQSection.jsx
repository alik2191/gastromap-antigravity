import React, { useState } from 'react';
import { motion } from "framer-motion";
import { ChevronDown, MessageCircle, Sparkles, CreditCard, Users } from "lucide-react";

const faqs = [
    {
        category: "General Questions",
        icon: MessageCircle,
        questions: [
            {
                q: "What is GastroGuide?",
                a: "GastroGuide is your personal guide to hidden culinary places around the world. We help discover authentic local cafés, restaurants, bars and markets that locals love."
            },
            {
                q: "How are new locations added?",
                a: "Locations are added by our curators and content creators who personally visit each place. All locations go through moderation before publication to ensure quality."
            },
            {
                q: "Which cities is the service available in?",
                a: "Currently we actively operate in Poland (Warsaw, Krakow and other cities). New countries coming soon! Stay tuned for updates."
            }
        ]
    },
    {
        category: "Features & Functionality",
        icon: Sparkles,
        questions: [
            {
                q: "What are 'Hidden Gems'?",
                a: "These are special places that are hard to find in regular guidebooks - favorite spots of locals that are little known to tourists. They are marked with a special badge."
            },
            {
                q: "How does the AI Guide work?",
                a: "Our AI assistant helps you find the perfect place based on your preferences. Just describe what you're looking for, and it will suggest suitable locations with personalized recommendations."
            },
            {
                q: "Can I save places?",
                a: "Yes! You can add places to 'Saved' (wishlist) or mark as 'Visited'. For each place you can add personal notes and ratings."
            },
            {
                q: "Is there offline access?",
                a: "Saved places are available in your profile at any time. We recommend saving your favorite locations in advance for convenient access."
            }
        ]
    },
    {
        category: "Subscription & Payment",
        icon: CreditCard,
        questions: [
            {
                q: "What plans are available?",
                a: "We offer monthly subscription ($9.99/mo), yearly ($49.99/yr - save 17%) and one-time Lifetime purchase ($149.99). All plans include full access to all locations and features."
            },
            {
                q: "Is there a free trial?",
                a: "You can browse the app and homepage for free. Full access to the location catalog requires an active subscription."
            },
            {
                q: "Can I cancel my subscription?",
                a: "Yes, you can cancel your subscription at any time. Access to features will remain until the end of the paid period."
            },
            {
                q: "What does Lifetime subscription include?",
                a: "One-time payment gives lifetime access to all current and future GastroGuide features without recurring payments."
            }
        ]
    },
    {
        category: "For Creators",
        icon: Users,
        questions: [
            {
                q: "How to become a Creator?",
                a: "Contact us through the support form. We're looking for people who know their city and are ready to share local finds with the community."
            },
            {
                q: "What can Creators do?",
                a: "Creators can add new locations through a special form. All submissions go through admin moderation before publication."
            },
            {
                q: "Is there compensation for Creators?",
                a: "Currently it's a community of enthusiasts. In the future we plan to launch a partnership program with rewards."
            }
        ]
    }
];

export default function FAQSection() {
    const [openIndex, setOpenIndex] = useState(null);

    return (
        <section className="py-20 sm:py-32 px-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16">
                    <motion.h2 
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-[1.1] mb-6"
                    >
                        <span className="text-neutral-900">Questions? </span>
                        <span className="text-blue-600">We've got answers</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-lg text-neutral-900 max-w-2xl mx-auto leading-relaxed"
                    >
                        Everything you need to know about GastroMap
                    </motion.p>
                </div>

                {/* FAQ Grid */}
                <div className="grid md:grid-cols-2 gap-8">
                    {faqs.map((category, catIndex) => {
                        const Icon = category.icon;
                        return (
                            <motion.div
                                key={catIndex}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: catIndex * 0.1 }}
                                className="space-y-4"
                            >
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/60 flex items-center justify-center shadow-sm">
                                        <Icon className="w-6 h-6 text-neutral-700" />
                                    </div>
                                    <h3 className="text-xl font-semibold tracking-tight text-neutral-900">
                                        {category.category}
                                    </h3>
                                </div>

                                <div className="space-y-3">
                                    {category.questions.map((item, qIndex) => {
                                        const itemIndex = `${catIndex}-${qIndex}`;
                                        const isOpen = openIndex === itemIndex;

                                        return (
                                            <motion.div
                                                key={qIndex}
                                                initial={{ opacity: 0 }}
                                                whileInView={{ opacity: 1 }}
                                                viewport={{ once: true }}
                                                transition={{ delay: qIndex * 0.05 }}
                                                className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-2xl overflow-hidden hover:bg-white/80 hover:shadow-md transition-all"
                                            >
                                                <button
                                                    onClick={() => setOpenIndex(isOpen ? null : itemIndex)}
                                                    className="w-full px-6 py-4 flex items-center justify-between gap-3 text-left"
                                                >
                                                    <span className="font-medium text-neutral-900 flex-1">
                                                        {item.q}
                                                    </span>
                                                    <ChevronDown
                                                        className={`w-5 h-5 text-neutral-400 transition-transform shrink-0 ${
                                                            isOpen ? 'rotate-180' : ''
                                                        }`}
                                                    />
                                                </button>

                                                {isOpen && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.3 }}
                                                        className="px-6 pb-5 border-t border-neutral-100"
                                                    >
                                                        <p className="text-neutral-600 leading-relaxed pt-4">
                                                            {item.a}
                                                        </p>
                                                    </motion.div>
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}