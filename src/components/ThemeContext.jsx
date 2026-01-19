import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        // Check localStorage first
        const saved = localStorage.getItem('theme');
        return saved || 'system';
    });

    const [resolvedTheme, setResolvedTheme] = useState('light');

    useEffect(() => {
        // Save to localStorage
        localStorage.setItem('theme', theme);

        // Resolve the actual theme to apply
        let actualTheme = theme;

        if (theme === 'system') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            actualTheme = prefersDark ? 'dark' : 'light';
        }

        setResolvedTheme(actualTheme);
        applyTheme(actualTheme);

    }, [theme]);

    // Apply theme to DOM and Meta tags
    const applyTheme = (newTheme) => {
        const root = document.documentElement;

        // Remove all existing theme-color tags (including media query ones)
        const metaTags = document.querySelectorAll('meta[name="theme-color"]');
        metaTags.forEach(tag => tag.remove());

        // Create a single authoritative tag for the current state
        const metaThemeColor = document.createElement('meta');
        metaThemeColor.name = 'theme-color';
        document.head.appendChild(metaThemeColor);

        if (newTheme === 'dark') {
            root.classList.add('dark');
            root.style.colorScheme = 'dark';
            metaThemeColor.setAttribute('content', '#000000');
        } else {
            root.classList.remove('dark');
            root.style.colorScheme = 'light';
            metaThemeColor.setAttribute('content', '#F2F2F7');
        }

        // Force browser reflow to update Status Bar immediately on iOS
        // This is a hack but necessary for instant visual feedback
        void root.offsetHeight;

        // Additional iOS Safari hack: temporarily manipulate viewport to force repaint
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            const originalContent = viewport.getAttribute('content');
            viewport.setAttribute('content', originalContent + ', minimal-ui');
            setTimeout(() => {
                viewport.setAttribute('content', originalContent);
            }, 10);
        }
    };

    // Listen for system theme changes
    useEffect(() => {
        if (theme !== 'system') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = (e) => {
            const newTheme = e.matches ? 'dark' : 'light';
            setResolvedTheme(newTheme);
            applyTheme(newTheme);
        };

        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(current => {
            if (current === 'light') return 'dark';
            if (current === 'dark') return 'system';
            return 'light';
        });
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
}