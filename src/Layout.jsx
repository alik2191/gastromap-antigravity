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

    // Public pages that should NOT have theme switching (always light)
    const publicPages = ['Home', 'Login', 'AuthCallback', 'Terms', 'Privacy', 'LocationPublic', 'Support', 'Pricing'];

    // Conditional wrapper based on page type
    const isPublicPage = publicPages.includes(currentPageName);

    const content = (
        <LanguageProvider>
            <Toaster position="top-center" richColors />
            <OfflineIndicator />
            <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-4 focus:bg-blue-600 focus:text-white focus:rounded">Skip to main content</a>
            {fullScreenPages.includes(currentPageName) ? (
                <main id="main-content">
                    {children}
                </main>
            ) : (
                <div className="min-h-screen bg-stone-50 dark:bg-black overflow-x-hidden w-full">
                    <main id="main-content">
                        {children}
                    </main>
                </div>
            )}
            <CookieBanner />
            <PWAInstallPrompt />
        </LanguageProvider>
    );

    // Only wrap with ThemeProvider for authenticated pages
    if (isPublicPage) {
        return content;
    }

    return (
        <ThemeProvider>
            {content}
        </ThemeProvider>
    );
}