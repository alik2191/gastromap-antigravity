import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/client';
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { MapPin, Star, Menu, Sparkles, Check, ChevronDown, MessageCircle, CreditCard, Users } from "lucide-react";
import Aurora from '../components/Aurora';
import CircularGallery from '../components/CircularGallery';
import ShowcaseCard from '../components/ShowcaseCard';
import StepOneAnimation from '../components/steps/StepOneAnimation';
import StepTwoAnimation from '../components/steps/StepTwoAnimation';
import StepThreeAnimation from '../components/steps/StepThreeAnimation';

const plans = [
    {
        id: "monthly",
        name: "Monthly",
        price: 9.99,
        period: "/mo",
        description: "For short trips",
        features: ["Access to all locations", "Save to favorites", "Basic recommendations"],
        color: "bg-white",
        textColor: "text-neutral-900"
    },
    {
        id: "yearly",
        name: "Yearly",
        price: 49.99,
        period: "/yr",
        description: "Traveler's choice",
        features: ["Everything in Monthly", "AI assistant 24/7", "Offline maps", "Exclusive guides"],
        popular: true,
        color: "bg-[#2C3E50]",
        textColor: "text-white"
    },
    {
        id: "lifetime",
        name: "Lifetime",
        price: 149.99,
        period: " forever",
        description: "One-time payment",
        features: ["Full unlimited access", "VIP support", "Early feature access", "Private community"],
        color: "bg-[#60a5fa]",
        textColor: "text-white"
    }
];

const faqs = [
    {
        category: "General Questions",
        icon: MessageCircle,
        questions: [
            {
                q: "What is GastroMap?",
                a: "GastroMap is your personal guide to hidden culinary places around the world. We help discover authentic local cafés, restaurants, bars and markets that locals love."
            },
            {
                q: "How are new locations added?",
                a: "Locations are added by our curators and content creators who personally visit each place. All locations go through moderation before publication to ensure quality."
            }
        ]
    },
    {
        category: "Features & Functionality",
        icon: Sparkles,
        questions: [
            {
                q: "What are 'Hidden Gems'?",
                a: "These are special places that are hard to find in regular guidebooks - favorite spots of locals that are little known to tourists."
            },
            {
                q: "How does the AI Guide work?",
                a: "Our AI assistant helps you find the perfect place based on your preferences. Just describe what you're looking for, and it will suggest suitable locations."
            }
        ]
    },
    {
        category: "Subscription & Payment",
        icon: CreditCard,
        questions: [
            {
                q: "What plans are available?",
                a: "We offer monthly subscription ($9.99/mo), yearly ($49.99/yr - save 17%) and one-time Lifetime purchase ($149.99)."
            },
            {
                q: "Can I cancel my subscription?",
                a: "Yes, you can cancel your subscription at any time. Access to features will remain until the end of the paid period."
            }
        ]
    },
    {
        category: "For Creators",
        icon: Users,
        questions: [
            {
                q: "How to become a Creator?",
                a: "Contact us through the support form. We're looking for people who know their city and are ready to share local finds with the community."
            },
            {
                q: "What can Creators do?",
                a: "Creators can add new locations through a special form. All submissions go through admin moderation before publication."
            }
        ]
    }
];

export default function Home2() {
    const [user, setUser] = useState(null);
    const [locations, setLocations] = useState([]);
    const [loadingPlan, setLoadingPlan] = useState(false);
    const [openFaqIndex, setOpenFaqIndex] = useState(null);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const userData = await base44.auth.me();
                setUser(userData);
            } catch (e) {
                // Not logged in
            }
        };
        
        // Demo данные для галереи
        const demoLocations = [
            {
                name: "Café de Flore",
                type: "cafe",
                city: "Paris",
                country: "France",
                price_range: "$$$",
                description: "Iconic Parisian café known for its literary history and exceptional coffee culture",
                image_url: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80"
            },
            {
                name: "Mercado de San Miguel",
                type: "market",
                city: "Madrid",
                country: "Spain",
                price_range: "$$",
                description: "Historic market offering the best tapas and jamón from local producers",
                image_url: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80"
            },
            {
                name: "The Artisan Bakery",
                type: "bakery",
                city: "Copenhagen",
                country: "Denmark",
                price_range: "$$",
                description: "Renowned for freshly baked sourdough bread and traditional Danish pastries",
                image_url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80"
            },
            {
                name: "Osteria Italiana",
                type: "restaurant",
                city: "Rome",
                country: "Italy",
                price_range: "$$$",
                description: "Authentic Italian cuisine with homemade pasta and traditional recipes",
                image_url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80"
            },
            {
                name: "Sky Lounge Bar",
                type: "bar",
                city: "New York",
                country: "USA",
                price_range: "$$$$",
                description: "Rooftop bar with craft cocktails and stunning Manhattan skyline views",
                image_url: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&q=80"
            },
            {
                name: "Vineyard Estate",
                type: "winery",
                city: "Tuscany",
                country: "Italy",
                price_range: "$$$",
                description: "Family-owned winery offering wine tastings and tours of historic cellars",
                image_url: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=800&q=80"
            },
            {
                name: "Corner Coffee House",
                type: "cafe",
                city: "Melbourne",
                country: "Australia",
                price_range: "$$",
                description: "Specialty coffee with cozy atmosphere and local art on the walls",
                image_url: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80"
            },
            {
                name: "Gourmet Market",
                type: "shop",
                city: "Tokyo",
                country: "Japan",
                price_range: "$$",
                description: "Curated selection of artisanal products and unique local ingredients",
                image_url: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800&q=80"
            }
        ];
        
        setLocations(demoLocations);
        checkAuth();
        }, []);

        const handlePurchase = async (plan) => {
        if (!user) {
            base44.auth.redirectToLogin(window.location.href);
            return;
        }

        setLoadingPlan(true);
        try {
            const startDate = new Date();
            let endDate = new Date();

            if (plan.id === 'monthly') endDate.setMonth(endDate.getMonth() + 1);
            else if (plan.id === 'yearly') endDate.setFullYear(endDate.getFullYear() + 1);
            else endDate.setFullYear(endDate.getFullYear() + 100);

            await base44.entities.Subscription.create({
                user_email: user.email,
                plan: plan.id,
                status: 'active',
                start_date: startDate.toISOString().split('T')[0],
                end_date: endDate.toISOString().split('T')[0],
                amount_paid: plan.price
            });

            window.location.href = createPageUrl('Dashboard');
        } catch (e) {
            console.error('Purchase error:', e);
        } finally {
            setLoadingPlan(false);
        }
        };

    return (
        <>
            <style dangerouslySetInnerHTML={{
                __html: `
                    @keyframes scroll {
                        0% { transform: translateX(0); }
                        100% { transform: translateX(-50%); }
                    }
                    
                    .scrolling-text {
                        animation: scroll 20s linear infinite;
                    }
                `
            }} />
            
            <div className="min-h-screen bg-[#F5F9FC] overflow-hidden relative">
                {/* Aurora Background */}
                <div className="fixed inset-0 z-0">
                    <Aurora 
                        colorStops={['#00D4AA', '#7cff67', '#00D4AA']}
                        amplitude={1.5}
                        blend={0.6}
                        speed={0.5}
                    />
                </div>
                
                {/* Header */}
                <header className="fixed top-0 left-0 right-0 z-50 bg-[#2C3E50]/95 backdrop-blur-sm text-white">
                    <div className="max-w-full mx-auto px-6 py-4 flex items-center justify-between">
                        {/* Logo left */}
                        <Link to={createPageUrl("Home")} className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-[#60a5fa] rounded-lg flex items-center justify-center text-white font-bold">
                                G
                            </div>
                            <span className="text-xl font-bold tracking-tight">GASTROMAP</span>
                        </Link>

                        {/* Sign Up/In right */}
                        <div className="flex items-center gap-3">
                            {user ? (
                                <Link to={createPageUrl("Dashboard")}>
                                    <Button className="bg-[#60a5fa] text-white hover:bg-[#3b82f6] rounded-md px-5 py-2 text-sm font-semibold">
                                        Dashboard
                                    </Button>
                                </Link>
                            ) : (
                                <Button 
                                    onClick={() => base44.auth.redirectToLogin(window.location.href)}
                                    className="bg-[#60a5fa] text-white hover:bg-[#3b82f6] rounded-md px-5 py-2 text-sm font-semibold"
                                >
                                    Sign Up / In
                                </Button>
                            )}
                        </div>
                    </div>
                </header>
                
                {/* Scrolling Banner */}
                <div className="fixed top-[60px] left-0 right-0 z-40 bg-[#60a5fa] text-white py-2 overflow-hidden whitespace-nowrap">
                    <div className="scrolling-text inline-block">
                        <span className="text-sm font-bold tracking-wide px-8">DISCOVER • EXPLORE THE WORLD • HIDDEN GEMS • DISCOVER • EXPLORE THE WORLD • HIDDEN GEMS • </span>
                        <span className="text-sm font-bold tracking-wide px-8">DISCOVER • EXPLORE THE WORLD • HIDDEN GEMS • DISCOVER • EXPLORE THE WORLD • HIDDEN GEMS • </span>
                    </div>
                </div>

                {/* Hero Section */}
                <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-32 pb-20 z-10">
                    {/* Hero Text */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-center mb-8 md:mb-20 z-10 max-w-5xl"
                    >
                        <h1 className="text-5xl md:text-8xl lg:text-9xl font-bold tracking-tight text-[#1A1A1A] mb-6 md:mb-8 leading-[0.95]">
                            Culinary Map <span className="text-[#60a5fa]">✦</span><br />
                            Built to Explore
                        </h1>
                        <p className="text-base md:text-xl text-[#2C2C2C] max-w-2xl mx-auto leading-relaxed font-medium px-4 mb-8">
                            Platform packed with hidden gems, local favorites,<br className="hidden md:block" />
                            insider tips, and a community of food lovers
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center px-4">
                            {user ? (
                                <Link to={createPageUrl("Dashboard")}>
                                    <Button className="bg-[#60a5fa] text-white hover:bg-[#3b82f6] rounded-xl px-6 py-3 text-base font-semibold shadow-md h-auto">
                                        Get Started
                                    </Button>
                                </Link>
                            ) : (
                                <Button 
                                    onClick={() => base44.auth.redirectToLogin(window.location.href)}
                                    className="bg-[#60a5fa] text-white hover:bg-[#3b82f6] rounded-xl px-6 py-3 text-base font-semibold shadow-md h-auto"
                                >
                                    Get Started
                                </Button>
                            )}

                            <Button 
                                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                                variant="outline" 
                                className="bg-white/80 backdrop-blur-sm border-2 border-[#60a5fa] text-[#60a5fa] hover:bg-[#60a5fa]/10 rounded-xl px-6 py-3 text-base font-semibold h-auto"
                            >
                                How it Works
                            </Button>
                        </div>
                    </motion.div>

                    {/* Circular Gallery */}
                    <div className="w-screen h-[400px] md:h-[600px] relative -mx-6 md:-mx-0 md:w-full">
                        {locations.length > 0 && (
                            <CircularGallery
                                items={locations.map(location => ({
                                    image: location.image_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
                                    name: location.name,
                                    type: location.type,
                                    city: location.city,
                                    country: location.country,
                                    price_range: location.price_range,
                                    description: location.description
                                }))}
                                bend={typeof window !== 'undefined' && window.innerWidth < 768 ? 1 : 2}
                                textColor="#2a2a2a"
                                borderRadius={0.08}
                                font="bold 24px sans-serif"
                                scrollSpeed={0.5}
                                scrollEase={0.08}
                            />
                        )}
                    </div>
                    </section>

                    {/* Features Section */}
                    <section className="relative min-h-screen flex items-center justify-center px-6 py-20 z-10">
                        <div className="max-w-6xl mx-auto">
                            <div className="text-center mb-16">
                                <h2 className="text-4xl md:text-6xl font-bold text-[#1A1A1A] mb-4">Discover Hidden Gems</h2>
                                <p className="text-lg md:text-xl text-[#2C2C2C] max-w-2xl mx-auto">Every location hand-picked by locals and food enthusiasts</p>
                            </div>

                            <div className="grid md:grid-cols-3 gap-8">
                                <ShowcaseCard
                                    image="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80"
                                    title="Osteria Italiana"
                                    category="Restaurant"
                                    overview="The culinary experience behind authentic Italian cuisine."
                                    description="Traditional Italian osteria offering homemade pasta, wood-fired pizzas, and carefully selected regional wines. Every dish tells a story of generations-old recipes passed down through family traditions."
                                    tags={["Fine Dining", "Family Recipe", "Wine Selection"]}
                                    buttonText="Explore"
                                />

                                <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                                    <div className="w-14 h-14 bg-[#60a5fa] rounded-2xl flex items-center justify-center mb-6">
                                        <Star className="w-7 h-7 text-white" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-[#1A1A1A] mb-3">Insider Tips</h3>
                                    <p className="text-[#2C2C2C] leading-relaxed">Get exclusive recommendations and must-try dishes from locals who know the best spots</p>
                                </div>

                                <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                                    <div className="w-14 h-14 bg-[#60a5fa] rounded-2xl flex items-center justify-center mb-6">
                                        <Sparkles className="w-7 h-7 text-white" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-[#1A1A1A] mb-3">AI Guide</h3>
                                    <p className="text-[#2C2C2C] leading-relaxed">Smart recommendations based on your preferences, location, and dietary requirements</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* How It Works Section */}
                    <section id="how-it-works" className="relative min-h-screen flex items-center justify-center px-6 py-20 z-10 bg-white/50">
                        <div className="max-w-6xl mx-auto">
                            <div className="text-center mb-16">
                                <h2 className="text-4xl md:text-6xl font-bold text-[#1A1A1A] mb-4">How It Works</h2>
                                <p className="text-lg md:text-xl text-[#2C2C2C] max-w-2xl mx-auto">Start your culinary journey in three simple steps</p>
                            </div>

                            <div className="grid md:grid-cols-3 gap-12">
                                {/* Step 1 */}
                                <div className="flex flex-col items-center">
                                    <div className="w-20 h-20 bg-[#60a5fa] rounded-full flex items-center justify-center text-white text-3xl font-bold mb-6 shadow-lg">
                                        1
                                    </div>
                                    <StepOneAnimation />
                                    <h3 className="text-2xl font-bold text-[#1A1A1A] mb-4 mt-6">Explore</h3>
                                    <p className="text-[#2C2C2C] leading-relaxed text-center">Browse through curated locations by country and city, or use our AI guide for personalized recommendations</p>
                                </div>

                                {/* Step 2 */}
                                <div className="flex flex-col items-center">
                                    <div className="w-20 h-20 bg-[#60a5fa] rounded-full flex items-center justify-center text-white text-3xl font-bold mb-6 shadow-lg">
                                        2
                                    </div>
                                    <StepTwoAnimation />
                                    <h3 className="text-2xl font-bold text-[#1A1A1A] mb-4 mt-6">Save & Plan</h3>
                                    <p className="text-[#2C2C2C] leading-relaxed text-center">Add places to your wishlist, read insider tips, and plan your next foodie adventure with detailed information</p>
                                </div>

                                {/* Step 3 */}
                                <div className="flex flex-col items-center">
                                    <div className="w-20 h-20 bg-[#60a5fa] rounded-full flex items-center justify-center text-white text-3xl font-bold mb-6 shadow-lg">
                                        3
                                    </div>
                                    <StepThreeAnimation />
                                    <h3 className="text-2xl font-bold text-[#1A1A1A] mb-4 mt-6">Experience</h3>
                                    <p className="text-[#2C2C2C] leading-relaxed text-center">Visit the locations, enjoy authentic cuisine, and share your experience with the community</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Testimonials Section */}
                    <section className="relative min-h-screen flex items-center justify-center px-6 py-20 z-10">
                        <div className="max-w-6xl mx-auto">
                            <div className="text-center mb-16">
                                <h2 className="text-4xl md:text-6xl font-bold text-[#1A1A1A] mb-4">What Food Lovers Say</h2>
                                <p className="text-lg md:text-xl text-[#2C2C2C] max-w-2xl mx-auto">Join thousands of food enthusiasts discovering authentic cuisine</p>
                            </div>

                            <div className="grid md:grid-cols-3 gap-8">
                                <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg">
                                    <div className="flex items-center gap-1 mb-4">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className="w-5 h-5 fill-[#3498DB] text-[#3498DB]" />
                                        ))}
                                    </div>
                                    <p className="text-[#2C2C2C] leading-relaxed mb-6">"Found the most amazing hidden café in Barcelona that I would never have discovered on my own. The insider tips are gold!"</p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-[#60a5fa] rounded-full flex items-center justify-center text-white font-bold">
                                            S
                                        </div>
                                        <div>
                                            <p className="font-semibold text-[#1A1A1A]">Sarah M.</p>
                                            <p className="text-sm text-[#2C2C2C]">Travel Blogger</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg">
                                    <div className="flex items-center gap-1 mb-4">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className="w-5 h-5 fill-[#3498DB] text-[#3498DB]" />
                                        ))}
                                    </div>
                                    <p className="text-[#2C2C2C] leading-relaxed mb-6">"The AI guide is incredibly smart. It suggested places based on my preferences and they were all perfect matches!"</p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-[#60a5fa] rounded-full flex items-center justify-center text-white font-bold">
                                            M
                                        </div>
                                        <div>
                                            <p className="font-semibold text-[#1A1A1A]">Marco R.</p>
                                            <p className="text-sm text-[#2C2C2C]">Food Enthusiast</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg">
                                    <div className="flex items-center gap-1 mb-4">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className="w-5 h-5 fill-[#3498DB] text-[#3498DB]" />
                                        ))}
                                    </div>
                                    <p className="text-[#2C2C2C] leading-relaxed mb-6">"Best investment for my travels. Every location is carefully curated and the must-try recommendations are spot on!"</p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-[#60a5fa] rounded-full flex items-center justify-center text-white font-bold">
                                            A
                                        </div>
                                        <div>
                                            <p className="font-semibold text-[#1A1A1A]">Anna K.</p>
                                            <p className="text-sm text-[#2C2C2C]">Chef</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Pricing Section */}
                    <section className="relative min-h-screen flex items-center justify-center px-6 py-20 z-10">
                        <div className="max-w-7xl mx-auto w-full">
                            <div className="text-center mb-16">
                                <h2 className="text-4xl md:text-6xl font-bold text-[#1A1A1A] mb-4">
                                    Invest in <span className="text-[#60a5fa]">experiences.</span>
                                </h2>
                                <p className="text-lg md:text-xl text-[#2C2C2C] max-w-2xl mx-auto">
                                    Simple pricing. No hidden fees. Cancel anytime.
                                </p>
                            </div>

                            <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                                {plans.map((plan, index) => (
                                    <div 
                                        key={index}
                                        className={`relative rounded-3xl p-8 flex flex-col justify-between h-full ${plan.color} ${plan.textColor} shadow-xl border border-white/20 min-h-[500px] group hover:-translate-y-2 transition-all duration-300`}
                                    >
                                        {plan.popular && (
                                            <div className="absolute -top-4 left-8 bg-[#60a5fa] text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg">
                                                MOST POPULAR
                                            </div>
                                        )}

                                        <div>
                                            <div className="mb-8">
                                                <h3 className="font-medium text-lg opacity-80 mb-1">{plan.name}</h3>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-4xl font-bold">${plan.price}</span>
                                                    <span className="opacity-60 text-sm">{plan.period}</span>
                                                </div>
                                                <p className="mt-4 text-sm opacity-70 leading-relaxed font-medium">
                                                    {plan.description}
                                                </p>
                                            </div>

                                            <div className="space-y-4 mb-8">
                                                {plan.features.map((feature, i) => (
                                                    <div key={i} className="flex items-start gap-3">
                                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${plan.color === 'bg-white' ? 'bg-neutral-100' : 'bg-white/20'}`}>
                                                            <Check className="w-3 h-3" />
                                                        </div>
                                                        <span className="text-sm font-medium opacity-90 leading-tight">{feature}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <Button 
                                            onClick={() => handlePurchase(plan)}
                                            disabled={loadingPlan}
                                            className={`w-full h-14 rounded-2xl text-base font-semibold transition-transform active:scale-95 ${
                                                plan.name === 'Yearly' 
                                                    ? 'bg-white text-[#2C3E50] hover:bg-neutral-100' 
                                                    : plan.name === 'Lifetime'
                                                        ? 'bg-white text-[#60a5fa] hover:bg-neutral-100'
                                                        : 'bg-[#2C3E50] text-white hover:bg-[#34495E]'
                                            }`}
                                        >
                                            {loadingPlan ? 'Processing...' : 'Choose Plan'}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* FAQ Section */}
                    <section className="relative min-h-screen flex items-center justify-center px-6 py-20 z-10 bg-white/50">
                        <div className="max-w-6xl mx-auto w-full">
                            <div className="text-center mb-16">
                                <h2 className="text-4xl md:text-6xl font-bold mb-6">
                                    <span className="text-[#60a5fa]">Questions?</span><br />
                                    <span className="text-[#2C2C2C]">We've got answers</span>
                                </h2>
                                <p className="text-lg text-[#2C2C2C] max-w-2xl mx-auto">
                                    Everything you need to know about GastroMap
                                </p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8">
                                {faqs.map((category, catIndex) => {
                                    const Icon = category.icon;
                                    return (
                                        <div key={catIndex} className="space-y-4">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="w-12 h-12 rounded-2xl bg-white backdrop-blur-xl border border-neutral-200 flex items-center justify-center shadow-sm">
                                                    <Icon className="w-6 h-6 text-[#60a5fa]" />
                                                </div>
                                                <h3 className="text-xl font-semibold text-[#1A1A1A]">
                                                    {category.category}
                                                </h3>
                                            </div>

                                            <div className="space-y-3">
                                                {category.questions.map((item, qIndex) => {
                                                    const itemIndex = `${catIndex}-${qIndex}`;
                                                    const isOpen = openFaqIndex === itemIndex;

                                                    return (
                                                        <div
                                                            key={qIndex}
                                                            className="bg-white backdrop-blur-xl border border-neutral-200 rounded-2xl overflow-hidden hover:shadow-md transition-all"
                                                        >
                                                            <button
                                                                onClick={() => setOpenFaqIndex(isOpen ? null : itemIndex)}
                                                                className="w-full px-6 py-4 flex items-center justify-between gap-3 text-left"
                                                            >
                                                                <span className="font-medium text-[#1A1A1A] flex-1">
                                                                    {item.q}
                                                                </span>
                                                                <ChevronDown
                                                                    className={`w-5 h-5 text-neutral-400 transition-transform shrink-0 ${
                                                                        isOpen ? 'rotate-180' : ''
                                                                    }`}
                                                                />
                                                            </button>

                                                            {isOpen && (
                                                                <div className="px-6 pb-5 border-t border-neutral-100">
                                                                    <p className="text-[#2C2C2C] leading-relaxed pt-4">
                                                                        {item.a}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>

                    {/* CTA Section */}
                    <section className="relative min-h-screen flex items-center justify-center px-6 py-20 z-10">
                        <div className="max-w-4xl mx-auto text-center">
                            <div className="bg-gradient-to-br from-[#60a5fa] to-[#3b82f6] rounded-[3rem] p-12 md:p-16 shadow-2xl">
                                <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">Ready to Explore?</h2>
                                <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-10 leading-relaxed">
                                    Join thousands of food lovers discovering hidden culinary gems around the world. Start your journey today!
                                </p>

                                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                                    {user ? (
                                        <Link to={createPageUrl("Dashboard")}>
                                            <Button className="bg-white text-[#60a5fa] hover:bg-gray-100 rounded-2xl px-8 py-6 text-lg font-semibold shadow-lg h-auto">
                                                Go to Dashboard
                                            </Button>
                                        </Link>
                                    ) : (
                                        <>
                                            <Button 
                                                onClick={() => base44.auth.redirectToLogin(window.location.href)}
                                                className="bg-white text-[#60a5fa] hover:bg-gray-100 rounded-2xl px-8 py-6 text-lg font-semibold shadow-lg h-auto"
                                            >
                                                Start Free Trial
                                            </Button>
                                            <Link to={createPageUrl("Pricing")}>
                                                <Button 
                                                    variant="outline" 
                                                    className="bg-transparent border-2 border-white text-white hover:bg-white/10 rounded-2xl px-8 py-6 text-lg font-semibold h-auto"
                                                >
                                                    View Pricing
                                                </Button>
                                            </Link>
                                        </>
                                    )}
                                </div>

                                <p className="text-white/70 text-sm mt-8">No credit card required • Cancel anytime</p>
                            </div>
                        </div>
                    </section>
                    </div>
                    </>
                    );
                    }