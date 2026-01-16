import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight, Globe, Star, LayoutGrid, MapPin, Heart, Check, Search, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, useInView, AnimatePresence } from "framer-motion";
import Header from './Header';

function AnimatedCounter({ target, suffix = '', duration = 2000 }) {
    const [count, setCount] = useState(0);
    const counterRef = useRef(null);
    const isInView = useInView(counterRef, { once: true });

    useEffect(() => {
        if (!isInView) return;

        let startTime;
        const targetNum = typeof target === 'string' ? parseInt(target.replace(/\D/g, '')) : target;
        
        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const current = Math.floor(easeOutQuart * targetNum);
            
            setCount(current);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setCount(targetNum);
            }
        };
        
        requestAnimationFrame(animate);
    }, [isInView, target, duration]);

    return (
        <span ref={counterRef}>
            {count.toLocaleString('ru-RU')}{suffix}
        </span>
    );
}

function AnimatedReviews() {
    const [activeIndex, setActiveIndex] = useState(0);
    
    const reviews = [
        {
            avatar: 'https://i.pravatar.cc/100?img=11',
            name: 'Anna K.',
            review: 'Found an amazing café in Warsaw! Incredible atmosphere ☕️',
            location: 'Warsaw, Poland'
        },
        {
            avatar: 'https://i.pravatar.cc/100?img=12',
            name: 'Michael S.',
            review: 'Hidden bar with the best cocktails in town 🍸',
            location: 'Krakow, Poland'
        },
        {
            avatar: 'https://i.pravatar.cc/100?img=13',
            name: 'Elena R.',
            review: 'Insider restaurant with authentic cuisine. Wow! 🍝',
            location: 'Gdansk, Poland'
        },
        {
            avatar: 'https://i.pravatar.cc/100?img=14',
            name: 'Dmitry V.',
            review: 'Bakery with incredible croissants. Must-have! 🥐',
            location: 'Wroclaw, Poland'
        }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % reviews.length);
        }, 3500);
        return () => clearInterval(interval);
    }, []);

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 bg-blue-100 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 flex flex-col justify-between relative overflow-hidden group min-h-[250px]"
        >
            <div className="absolute top-0 right-0 p-8">
                <ArrowRight className="w-8 h-8 -rotate-45 text-blue-600 group-hover:rotate-0 transition-transform duration-300" />
            </div>
            
            <div>
                <h3 className="text-3xl font-semibold text-blue-900 mb-2">
                    <AnimatedCounter target={12000} suffix="+" />
                </h3>
                <p className="text-blue-700">Verified Locations</p>
            </div>

            {/* Review Display */}
            <motion.div 
                key={activeIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5 }}
                className="bg-white/50 backdrop-blur-sm rounded-2xl p-3 mb-3 border border-white/60"
            >
                <p className="text-sm text-blue-900 font-medium mb-1 line-clamp-2">
                    "{reviews[activeIndex].review}"
                </p>
                <p className="text-xs text-blue-700/70">
                    {reviews[activeIndex].name} • {reviews[activeIndex].location}
                </p>
            </motion.div>

            {/* Avatars */}
            <div className="flex -space-x-3">
                {reviews.map((review, i) => (
                    <motion.div
                        key={i}
                        animate={{
                            scale: activeIndex === i ? 1.3 : 1,
                            opacity: activeIndex === i ? 1 : 0.5,
                            zIndex: activeIndex === i ? 10 : 1,
                            y: activeIndex === i ? -4 : 0
                        }}
                        transition={{
                            duration: 0.5,
                            ease: [0.22, 1, 0.36, 1]
                        }}
                        className="relative w-10 h-10 rounded-full border-2 border-white bg-neutral-200 overflow-hidden"
                    >
                        <img src={review.avatar} alt={review.name} className="w-full h-full object-cover" />
                        {activeIndex === i && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute inset-0 border-2 border-blue-500 rounded-full"
                            />
                        )}
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}

// Feature Card 1: AI Guide with Route Planning
function AIRecommendationCard() {
    const [text, setText] = useState('');
    const fullText = "Perfect! I'll plan a route for you: Start at Cafe Mozart (specialty coffee), walk 5min to La Bottega (Italian lunch), then 10min to Rooftop Bar (sunset cocktails) 🗺️✨";
    
    useEffect(() => {
        let index = 0;
        const interval = setInterval(() => {
            if (index <= fullText.length) {
                setText(fullText.slice(0, index));
                index++;
            } else {
                setTimeout(() => {
                    setText('');
                    index = 0;
                }, 3000);
            }
        }, 40);
        return () => clearInterval(interval);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="group relative bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl md:rounded-3xl overflow-hidden cursor-pointer h-[160px] sm:h-[180px] md:h-[200px] shadow-sm hover:shadow-xl transition-all border border-purple-200"
        >
            <div className="relative h-full p-3 sm:p-4 md:p-6 flex flex-col">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 transition-colors duration-300">
                        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-neutral-900 font-semibold text-base sm:text-lg md:text-xl leading-tight truncate">
                            AI Guide
                        </h3>
                        <p className="text-neutral-600 text-sm truncate">
                            Routes & Memory
                        </p>
                    </div>
                </div>

                {/* AI Chat Simulation */}
                <div className="flex-1 min-h-0">
                    <div className="bg-white/70 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 border border-purple-200 h-full overflow-hidden">
                        <p className="text-[9px] sm:text-[10px] md:text-xs text-neutral-700 font-medium line-clamp-3 sm:line-clamp-4">
                            {text}
                            <motion.span
                                animate={{ opacity: [1, 0] }}
                                transition={{ duration: 0.8, repeat: Infinity }}
                                className="inline-block w-0.5 sm:w-1 h-2 sm:h-3 bg-purple-600 ml-0.5"
                            />
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// Feature Card 2: Lists
function ListsCard() {
    const [activeList, setActiveList] = useState(0);
    const lists = [
        { name: 'Wish-list', items: ['Cafe Mozart', 'La Bottega', 'Rooftop Bar'], icon: Heart, color: 'rose' },
        { name: 'Visited', items: ['Folk Gospoda', 'Stary Browar', 'Milk Bar'], icon: Check, color: 'green' }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveList(prev => (prev + 1) % lists.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const current = lists[activeList];
    const Icon = current.icon;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="group relative bg-white/80 backdrop-blur-md rounded-2xl md:rounded-3xl overflow-hidden cursor-pointer h-[160px] sm:h-[180px] md:h-[200px] shadow-sm hover:shadow-xl transition-all border border-neutral-200"
        >
            <div className="relative h-full p-3 sm:p-4 md:p-6 flex flex-col">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-neutral-900 group-hover:bg-blue-600 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 transition-colors duration-300">
                        <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-neutral-900 font-semibold text-base sm:text-lg md:text-xl leading-tight truncate">
                            Smart Lists
                        </h3>
                        <p className="text-neutral-600 text-sm truncate">
                            Wish-list & Visited
                        </p>
                    </div>
                </div>

                {/* Lists Simulation */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeList}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex-1 space-y-1 sm:space-y-1.5 min-h-0 overflow-hidden"
                    >
                        <div className="flex items-center gap-1 sm:gap-1.5 mb-1 sm:mb-2">
                            <Icon className={`w-2.5 h-2.5 sm:w-3 sm:h-3 text-${current.color}-500`} />
                            <span className="text-[9px] sm:text-[10px] md:text-xs font-semibold text-neutral-800">{current.name}</span>
                        </div>
                        {current.items.slice(0, 2).map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-blue-50 backdrop-blur-sm rounded-lg p-1 sm:p-1.5 border border-blue-200 flex items-center gap-1 sm:gap-1.5"
                            >
                                <div className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-${current.color}-500 shrink-0`} />
                                <span className="text-[8px] sm:text-[9px] md:text-[10px] text-neutral-700 font-medium truncate">{item}</span>
                            </motion.div>
                        ))}
                    </motion.div>
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

// Feature Card 3: Interactive Map
function MapCard() {
    const locations = [
        { x: 30, y: 40, delay: 0 },
        { x: 60, y: 30, delay: 0.2 },
        { x: 45, y: 60, delay: 0.4 },
        { x: 70, y: 50, delay: 0.6 }
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0, duration: 0.6 }}
            className="group relative bg-white/80 backdrop-blur-md rounded-2xl md:rounded-3xl overflow-hidden cursor-pointer h-[160px] sm:h-[180px] md:h-[200px] shadow-sm hover:shadow-xl transition-all border border-neutral-200"
        >
            <div className="relative h-full p-3 sm:p-4 md:p-6 flex flex-col">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-neutral-900 group-hover:bg-blue-600 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 transition-colors duration-300">
                        <MapPin className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-neutral-900 font-semibold text-base sm:text-lg md:text-xl leading-tight truncate">
                            Interactive Maps
                        </h3>
                        <p className="text-neutral-600 text-sm truncate">
                            Navigation
                        </p>
                    </div>
                </div>

                {/* Map Simulation */}
                <div className="flex-1 relative bg-blue-50 backdrop-blur-sm rounded-lg sm:rounded-xl border border-blue-200 overflow-hidden min-h-0">
                    {/* Grid background */}
                    <div className="absolute inset-0 opacity-30">
                        <div className="grid grid-cols-6 grid-rows-4 h-full">
                            {[...Array(24)].map((_, i) => (
                                <div key={i} className="border border-blue-300" />
                            ))}
                        </div>
                    </div>
                    
                    {/* Animated markers */}
                    {locations.map((loc, i) => (
                        <motion.div
                            key={i}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ 
                                scale: [0, 1.2, 1],
                                opacity: 1,
                                y: [0, -2, 0]
                            }}
                            transition={{
                                delay: loc.delay,
                                duration: 0.6,
                                y: { repeat: Infinity, duration: 2, delay: loc.delay }
                            }}
                            className="absolute w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4 bg-blue-600 rounded-full border border-white sm:border-2 shadow-lg"
                            style={{ left: `${loc.x}%`, top: `${loc.y}%` }}
                        >
                            <motion.div
                                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0] }}
                                transition={{ repeat: Infinity, duration: 2, delay: loc.delay }}
                                className="absolute inset-0 bg-blue-500 rounded-full"
                            />
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}

// Feature Card 4: Global Search
function SearchCard() {
    const [query, setQuery] = useState('');
    const [showResults, setShowResults] = useState(false);
    const searchText = 'Cafe in Warsaw';
    const results = ['Cafe Mozart', 'La Bottega Bistro', 'Folk Gospoda'];

    useEffect(() => {
        let index = 0;
        const interval = setInterval(() => {
            if (index <= searchText.length) {
                setQuery(searchText.slice(0, index));
                setShowResults(index === searchText.length);
                index++;
            } else {
                setTimeout(() => {
                    setQuery('');
                    setShowResults(false);
                    index = 0;
                }, 2000);
            }
        }, 100);
        return () => clearInterval(interval);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.6 }}
            className="group relative bg-white/80 backdrop-blur-md rounded-2xl md:rounded-3xl overflow-hidden cursor-pointer h-[160px] sm:h-[180px] md:h-[200px] shadow-sm hover:shadow-xl transition-all border border-neutral-200"
        >
            <div className="relative h-full p-3 sm:p-4 md:p-6 flex flex-col">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-neutral-900 group-hover:bg-blue-600 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 transition-colors duration-300">
                        <Globe className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-neutral-900 font-semibold text-base sm:text-lg md:text-xl leading-tight truncate">
                            Global Search
                        </h3>
                        <p className="text-neutral-600 text-sm truncate">
                            Find anywhere
                        </p>
                    </div>
                </div>

                {/* Search Simulation */}
                <div className="flex-1 min-h-0 overflow-hidden">
                    <div className="bg-blue-50 backdrop-blur-sm rounded-lg sm:rounded-xl p-1.5 sm:p-2 border border-blue-200 mb-1.5 sm:mb-2">
                        <div className="flex items-center gap-1 sm:gap-1.5">
                            <Search className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-neutral-500 shrink-0" />
                            <span className="text-[9px] sm:text-[10px] md:text-xs text-neutral-700 truncate">
                                {query}
                                <motion.span
                                    animate={{ opacity: [1, 0] }}
                                    transition={{ duration: 0.8, repeat: Infinity }}
                                    className="inline-block w-0.5 h-2 sm:h-2.5 bg-blue-600 ml-0.5"
                                />
                            </span>
                        </div>
                    </div>

                    <AnimatePresence>
                        {showResults && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-0.5 sm:space-y-1"
                            >
                                {results.slice(0, 2).map((result, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="bg-blue-50 backdrop-blur-sm rounded-lg p-1 sm:p-1.5 border border-blue-200 flex items-center gap-1 sm:gap-1.5"
                                    >
                                        <MapPin className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-blue-600 shrink-0" />
                                        <span className="text-[8px] sm:text-[9px] md:text-[10px] text-neutral-700 font-medium truncate">{result}</span>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
}

export default function HeroSection() {
    return (
        <section className="relative min-h-screen text-neutral-900 overflow-hidden font-sans selection:bg-blue-100">
            <Header />

            <div className="max-w-7xl mx-auto px-6 pt-32 pb-20">
                {/* Hero Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* Main Text Block */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        className="lg:col-span-8 bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-16 flex flex-col justify-center relative overflow-hidden shadow-sm"
                    >
                        <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 0.5 }}
                            transition={{ duration: 1.2, ease: "easeOut" }}
                            className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -mr-16 -mt-16"
                        />
                        
                        <div className="relative z-10">
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3, duration: 0.6 }}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 rounded-full text-sm font-medium mb-8 w-fit"
                            >
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                </span>
                                Beta Version Live
                            </motion.div>

                            <motion.h1 
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="text-4xl sm:text-5xl md:text-7xl font-semibold tracking-tight leading-[1.1] mb-6 break-words hyphens-auto"
                            >
                                <span className="text-neutral-900">Explore flavors </span>
                                <span className="text-blue-600">without borders.</span>
                            </motion.h1>
                            
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                                className="text-lg md:text-xl text-neutral-900 max-w-lg mb-8 md:mb-10 leading-relaxed font-medium"
                            >
                                AI-powered guide with route planning, achievements, and personalized recommendations. Discover hidden culinary gems worldwide.
                            </motion.p>

                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6, duration: 0.6 }}
                                className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto"
                            >
                                <Link to={createPageUrl("Pricing")} className="w-full sm:w-auto">
                                    <Button className="w-full sm:w-auto h-12 md:h-14 px-6 md:px-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-base md:text-lg transition-all hover:scale-105">
                                        Get Started
                                    </Button>
                                </Link>
                                <Button className="w-full sm:w-auto h-12 md:h-14 px-6 md:px-8 rounded-full text-base md:text-lg bg-neutral-900 hover:bg-neutral-800 text-white">
                                    How it Works
                                </Button>
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* Right Side Grid */}
                    <div className="lg:col-span-4 flex flex-col gap-6">
                        {/* Visual Card 1 */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                            className="flex-1 bg-neutral-900 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 text-white relative overflow-hidden min-h-[250px] md:min-h-[300px] group cursor-default"
                        >
                            <img 
                                src="https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&q=80"
                                alt="Bar"
                                className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700"
                            />
                            <div className="relative z-10 h-full flex flex-col justify-end">
                                <div className="bg-white/20 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                                    <h3 className="text-xl font-medium mb-1">Hidden Bars</h3>
                                    <p className="text-white/80 text-sm">For insiders only</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Visual Card 2 */}
                        <AnimatedReviews />
                    </div>
                </div>

                {/* Bottom Features Cards */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-7xl mx-auto"
                >
                    <AIRecommendationCard />
                    <ListsCard />
                    <MapCard />
                    <SearchCard />
                </motion.div>
            </div>
        </section>
    );
}