import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Trophy } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

export default function AchievementNotification({ achievement, onClose }) {
    const { language } = useLanguage();
    const [show, setShow] = useState(true);

    useEffect(() => {
        if (achievement) {
            // Trigger confetti
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#FFD700', '#FFA500', '#FF6347']
            });

            // Auto-hide after 5 seconds
            const timer = setTimeout(() => {
                setShow(false);
                setTimeout(onClose, 300);
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [achievement, onClose]);

    if (!achievement) return null;

    const title = achievement.title[language] || achievement.title.en;
    const description = achievement.description[language] || achievement.description.en;
    const Icon = achievement.icon;

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ scale: 0, opacity: 0, y: 50 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0, opacity: 0, y: -50 }}
                    className="fixed top-24 left-1/2 -translate-x-1/2 z-[10000] w-96 max-w-[90vw]"
                >
                    <div className={`bg-gradient-to-br ${achievement.color} p-1 rounded-2xl shadow-2xl`}>
                        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6">
                            <div className="flex items-start gap-4">
                                <div className={`w-14 h-14 bg-gradient-to-br ${achievement.color} rounded-xl flex items-center justify-center shrink-0`}>
                                    <Icon className="w-7 h-7 text-white" />
                                </div>
                                
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Trophy className="w-4 h-4 text-amber-500" />
                                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                                            Achievement Unlocked!
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-1">
                                        {title}
                                    </h3>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                        {description}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}