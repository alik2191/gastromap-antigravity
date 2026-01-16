import React, { useEffect } from 'react';
import { LanguageProvider } from './components/LanguageContext';
import { ThemeProvider } from './components/ThemeContext';
import CookieBanner from './components/CookieBanner';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import OfflineIndicator from './components/OfflineIndicator';
import { Toaster } from 'sonner';

export default function Layout({ children, currentPageName }) {
    // Register service worker
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker
                .register('/sw.js')
                .then(() => console.log('Service Worker registered'))
                .catch((err) => console.error('Service Worker registration failed:', err));
        }
        
        // Add preconnect hints for external image domains
        const preconnectDomains = [
            'https://images.unsplash.com',
            'https://lh3.googleusercontent.com'
        ];
        
        preconnectDomains.forEach(domain => {
            if (!document.querySelector(`link[rel="preconnect"][href="${domain}"]`)) {
                const link = document.createElement('link');
                link.rel = 'preconnect';
                link.href = domain;
                link.crossOrigin = 'anonymous';
                document.head.appendChild(link);
            }
        });
    }, []);

    // Pages that don't need any wrapper
    const fullScreenPages = ['Home', 'Dashboard', 'Admin', 'Pricing', 'Privacy', 'Support', 'Terms'];
    
    if (fullScreenPages.includes(currentPageName)) {
        return (
            <ThemeProvider>
                <LanguageProvider>
                    <Toaster position="top-center" richColors />
                    <OfflineIndicator />
                    <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-4 focus:bg-blue-600 focus:text-white focus:rounded">Skip to main content</a>
                    <main id="main-content">
                        {children}
                    </main>
                    <CookieBanner />
                    <PWAInstallPrompt />
                </LanguageProvider>
            </ThemeProvider>
        );
    }

    return (
        <ThemeProvider>
            <LanguageProvider>
                <Toaster position="top-center" richColors />
                <OfflineIndicator />
                <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-4 focus:bg-blue-600 focus:text-white focus:rounded">Skip to main content</a>
                <div className="min-h-screen bg-stone-50 dark:bg-neutral-900 overflow-x-hidden w-full">
                    <main id="main-content">
                        {children}
                    </main>
                    <CookieBanner />
                    <PWAInstallPrompt />
                </div>
            </LanguageProvider>
        </ThemeProvider>
    );
}