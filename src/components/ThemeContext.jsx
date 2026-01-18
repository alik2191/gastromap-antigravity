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
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');

        // Create if missing (failsafe)
        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.name = 'theme-color';
            document.head.appendChild(metaThemeColor);
        }

        if (newTheme === 'dark') {
            root.classList.add('dark');
            root.style.colorScheme = 'dark';
            // Use pure black or matching background
            metaThemeColor.setAttribute('content', '#0a0a0a');
        } else {
            root.classList.remove('dark');
            root.style.colorScheme = 'light';
            metaThemeColor.setAttribute('content', '#ffffff');
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