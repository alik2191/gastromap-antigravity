import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { X, Download, Monitor, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from './LanguageContext';

export default function PWAInstallPrompt() {
    const { t } = useLanguage();
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            
            // Check if user has dismissed before
            const dismissed = localStorage.getItem('pwa-dismissed');
            if (!dismissed) {
                setShowPrompt(true);
            }
        };

        window.addEventListener('beforeinstallprompt', handler);
        
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            console.log('PWA installed');
        }
        
        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('pwa-dismissed', Date.now().toString());
    };

    if (!showPrompt) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-[9998] bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 p-5"
            >
                <button
                    onClick={handleDismiss}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
                    aria-label="Close install prompt"
                >
                    <X className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
                </button>

                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shrink-0">
                        <Download className="w-6 h-6 text-white" />
                    </div>
                    
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-1">
                            {t('installApp') || 'Установить приложение'}
                        </h3>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                            {t('installAppDescription') || 'Добавьте GastroMap на главный экран для быстрого доступа и работы офлайн'}
                        </p>
                        
                        <div className="flex gap-2">
                            <Button 
                                onClick={handleInstall}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10"
                            >
                                {t('install') || 'Установить'}
                            </Button>
                            <Button 
                                onClick={handleDismiss}
                                variant="ghost"
                                className="rounded-xl h-10"
                            >
                                {t('later') || 'Позже'}
                            </Button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}