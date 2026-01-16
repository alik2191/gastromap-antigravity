import React from 'react';
import { Home, Map, Heart, CheckCircle2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../LanguageContext';

export default function MobileBottomNav({ activeTab, onTabChange }) {
    const { t } = useLanguage();
    
    const tabs = [
        { id: 'discover', labelKey: 'discoverTab', icon: Home },
        { id: 'map', labelKey: 'mapTab', icon: Map },
        { id: 'ai', labelKey: 'aiGuide', icon: Sparkles },
        { id: 'saved', labelKey: 'savedTab', icon: Heart },
        { id: 'done', labelKey: 'doneTab', icon: CheckCircle2 }
    ];

    const activeIndex = tabs.findIndex(tab => tab.id === activeTab);

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-t border-stone-200 dark:border-neutral-700 pb-safe md:hidden z-50">
            <div className="relative grid grid-cols-5 h-16">
                {/* Animated sliding indicator */}
                <motion.div
                    className="absolute top-0 left-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 rounded-full"
                    initial={false}
                    animate={{
                        x: `${activeIndex * 100}%`,
                        width: '20%'
                    }}
                    transition={{
                        type: 'spring',
                        stiffness: 380,
                        damping: 30
                    }}
                />

                {tabs.map((tab, index) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    
                    return (
                        <motion.button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className="relative flex flex-col items-center justify-center gap-1"
                            whileTap={{ scale: 0.85 }}
                        >
                            {/* Ripple background */}
                            <AnimatePresence>
                                {isActive && (
                                    <motion.div
                                        layoutId="navBubble"
                                        className="absolute inset-2 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 rounded-2xl"
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.8, opacity: 0 }}
                                        transition={{
                                            type: 'spring',
                                            stiffness: 400,
                                            damping: 25
                                        }}
                                    />
                                )}
                            </AnimatePresence>

                            <motion.div
                                className="relative z-10"
                                animate={{
                                    scale: isActive ? 1.15 : 1,
                                    rotate: isActive ? [0, -8, 8, 0] : 0,
                                    y: isActive ? -2 : 0
                                }}
                                transition={{
                                    scale: { type: 'spring', stiffness: 400, damping: 15 },
                                    rotate: { duration: 0.5 },
                                    y: { type: 'spring', stiffness: 400, damping: 15 }
                                }}
                            >
                                <Icon 
                                    className={`w-6 h-6 transition-colors ${
                                        isActive ? 'text-blue-600 dark:text-blue-400' : 'text-stone-400 dark:text-neutral-500'
                                    }`}
                                />
                            </motion.div>

                            <motion.span
                                className={`relative z-10 text-[10px] font-medium transition-colors ${
                                    isActive ? 'text-blue-600 dark:text-blue-400' : 'text-stone-500 dark:text-neutral-400'
                                }`}
                                animate={{
                                    scale: isActive ? 1.05 : 1,
                                    fontWeight: isActive ? 600 : 500
                                }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 400,
                                    damping: 20
                                }}
                            >
                                {t(tab.labelKey)}
                            </motion.span>

                            {/* Sparkle particles */}
                            <AnimatePresence>
                                {isActive && (
                                    <>
                                        <motion.div
                                            className="absolute top-2 right-2 w-2 h-2 bg-blue-400 rounded-full"
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ 
                                                scale: [0, 1.2, 0],
                                                opacity: [0, 1, 0]
                                            }}
                                            transition={{
                                                duration: 0.6,
                                                times: [0, 0.5, 1]
                                            }}
                                        />
                                        <motion.div
                                            className="absolute bottom-2 left-2 w-1.5 h-1.5 bg-purple-400 rounded-full"
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ 
                                                scale: [0, 1.2, 0],
                                                opacity: [0, 1, 0]
                                            }}
                                            transition={{
                                                duration: 0.6,
                                                delay: 0.1,
                                                times: [0, 0.5, 1]
                                            }}
                                        />
                                        <motion.div
                                            className="absolute top-1/2 right-1 w-1 h-1 bg-pink-300 rounded-full"
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ 
                                                scale: [0, 1, 0],
                                                opacity: [0, 1, 0]
                                            }}
                                            transition={{
                                                duration: 0.5,
                                                delay: 0.2,
                                                times: [0, 0.5, 1]
                                            }}
                                        />
                                    </>
                                )}
                            </AnimatePresence>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}