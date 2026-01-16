import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi } from 'lucide-react';
import { useLanguage } from './LanguageContext';

export default function OfflineIndicator() {
    const { t } = useLanguage();
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showNotification, setShowNotification] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setShowNotification(true);
            setTimeout(() => setShowNotification(false), 3000);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowNotification(true);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <AnimatePresence>
            {showNotification && (
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    className={`fixed top-20 left-1/2 -translate-x-1/2 z-[9999] px-6 py-3 rounded-full shadow-lg flex items-center gap-2 ${
                        isOnline 
                            ? 'bg-green-500 text-white' 
                            : 'bg-orange-500 text-white'
                    }`}
                >
                    {isOnline ? (
                        <>
                            <Wifi className="w-5 h-5" />
                            <span className="font-medium">{t('backOnline') || 'Вы снова онлайн'}</span>
                        </>
                    ) : (
                        <>
                            <WifiOff className="w-5 h-5" />
                            <span className="font-medium">{t('offline') || 'Офлайн режим'}</span>
                        </>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}