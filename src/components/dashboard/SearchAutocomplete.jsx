import React, { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Search, MapPin, Globe, Tag, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from '../LanguageContext';

export default function SearchAutocomplete({ 
    locations, 
    value, 
    onChange, 
    onSelect,
    placeholder = "Search...",
    className = ""
}) {
    const { t } = useLanguage();
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [recentSearches, setRecentSearches] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const inputRef = useRef(null);
    const containerRef = useRef(null);

    // Load recent searches
    useEffect(() => {
        const saved = localStorage.getItem('recent-searches');
        if (saved) {
            try {
                setRecentSearches(JSON.parse(saved).slice(0, 5));
            } catch (e) {
                console.error('Failed to load recent searches', e);
            }
        }
    }, []);

    // Generate suggestions
    useEffect(() => {
        if (value.trim().length >= 2) {
            generateSuggestions(value);
        } else {
            setSuggestions([]);
            setSelectedIndex(-1);
        }
    }, [value, locations]);

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const generateSuggestions = (query) => {
        const lowerQuery = query.toLowerCase();
        const results = [];

        // 1. Locations
        const locationMatches = locations
            .filter(loc => 
                loc.name.toLowerCase().includes(lowerQuery) ||
                loc.description?.toLowerCase().includes(lowerQuery)
            )
            .slice(0, 6)
            .map(loc => ({
                type: 'location',
                text: loc.name,
                subtext: `${loc.city}, ${loc.country}`,
                icon: MapPin,
                data: loc,
                rating: loc.average_rating
            }));

        // 2. Cities
        const cities = [...new Set(locations.map(l => l.city))];
        const cityMatches = cities
            .filter(city => city && city.toLowerCase().includes(lowerQuery))
            .slice(0, 3)
            .map(city => ({
                type: 'city',
                text: city,
                subtext: `${locations.filter(l => l.city === city).length} ${t('places') || 'places'}`,
                icon: Globe,
                data: { city }
            }));

        // 3. Countries
        const countries = [...new Set(locations.map(l => l.country))];
        const countryMatches = countries
            .filter(country => country && country.toLowerCase().includes(lowerQuery))
            .slice(0, 2)
            .map(country => ({
                type: 'country',
                text: country,
                subtext: `${locations.filter(l => l.country === country).length} ${t('places') || 'places'}`,
                icon: Globe,
                data: { country }
            }));

        // Organize by categories
        if (locationMatches.length > 0) results.push({ category: 'locations', items: locationMatches });
        if (cityMatches.length > 0) results.push({ category: 'cities', items: cityMatches });
        if (countryMatches.length > 0) results.push({ category: 'countries', items: countryMatches });

        setSuggestions(results);
        setSelectedIndex(-1);
    };

    const handleSelect = (suggestion) => {
        const searchTerm = suggestion.text;
        onChange(searchTerm);
        
        // Save to recent searches
        const updated = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5);
        setRecentSearches(updated);
        localStorage.setItem('recent-searches', JSON.stringify(updated));
        
        setShowSuggestions(false);
        inputRef.current?.blur();
        
        if (onSelect) {
            onSelect(suggestion);
        }
    };

    // Keyboard navigation
    const handleKeyDown = (e) => {
        const allItems = suggestions.flatMap(cat => cat.items);
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev < allItems.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
            e.preventDefault();
            handleSelect(allItems[selectedIndex]);
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
            inputRef.current?.blur();
        }
    };

    // Highlight matching text
    const highlightMatch = (text, query) => {
        if (!query) return text;
        const parts = text.split(new RegExp(`(${query})`, 'gi'));
        return parts.map((part, i) => 
            part.toLowerCase() === query.toLowerCase() 
                ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-500/30 text-neutral-900 dark:text-neutral-100">{part}</mark>
                : part
        );
    };

    return (
        <div ref={containerRef} className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500 z-10 pointer-events-none" />
            <Input 
                ref={inputRef}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={handleKeyDown}
                className={`pl-9 ${className}`}
                autoComplete="off"
            />
            
            <AnimatePresence>
                {showSuggestions && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-800 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden z-50 max-h-[500px] overflow-y-auto"
                    >
                        {/* Recent searches */}
                        {!value && recentSearches.length > 0 && (
                            <div className="p-3 border-b dark:border-neutral-700">
                                <div className="flex items-center gap-2 mb-2">
                                    <Clock className="w-4 h-4 text-neutral-400" />
                                    <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                                        {t('recentSearches') || 'Recent'}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {recentSearches.map((search, idx) => (
                                        <Badge
                                            key={idx}
                                            variant="secondary"
                                            className="cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-600"
                                            onClick={() => onChange(search)}
                                        >
                                            {search}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Categorized suggestions */}
                        {suggestions.length > 0 ? (
                            suggestions.map((category, catIdx) => {
                                let globalIndex = suggestions
                                    .slice(0, catIdx)
                                    .reduce((sum, cat) => sum + cat.items.length, 0);

                                return (
                                    <div key={category.category} className="border-b last:border-b-0 dark:border-neutral-700">
                                        <div className="px-4 py-2 bg-neutral-50 dark:bg-neutral-900/50">
                                            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                                                {category.category === 'locations' ? (t('locations') || 'Places')
                                                    : category.category === 'cities' ? (t('cities') || 'Cities')
                                                    : t('countries') || 'Countries'}
                                            </span>
                                        </div>
                                        {category.items.map((suggestion, itemIdx) => {
                                            const currentIndex = globalIndex + itemIdx;
                                            const Icon = suggestion.icon;
                                            const isSelected = currentIndex === selectedIndex;

                                            return (
                                                <button
                                                    key={itemIdx}
                                                    onClick={() => handleSelect(suggestion)}
                                                    className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors ${
                                                        isSelected 
                                                            ? 'bg-blue-50 dark:bg-blue-900/20' 
                                                            : 'hover:bg-neutral-50 dark:hover:bg-neutral-700'
                                                    }`}
                                                >
                                                    <Icon className={`w-4 h-4 shrink-0 ${
                                                        isSelected ? 'text-blue-600' : 'text-neutral-400'
                                                    }`} />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                                            {highlightMatch(suggestion.text, value)}
                                                        </div>
                                                        <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                                                            {suggestion.subtext}
                                                            {suggestion.data?.is_hidden_gem && (
                                                                <Badge className="ml-1 bg-amber-100 text-amber-700 text-[10px] px-1 py-0">
                                                                    Hidden Gem
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {suggestion.rating && (
                                                        <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                                                            ⭐ {suggestion.rating.toFixed(1)}
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                );
                            })
                        ) : value && value.length >= 2 ? (
                            <div className="px-4 py-8 text-center text-neutral-500 dark:text-neutral-400">
                                {t('noResults') || 'No results found'}
                            </div>
                        ) : null}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}