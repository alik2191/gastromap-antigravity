import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, ArrowRight, Lock, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from 'framer-motion';

const previewLocations = [
    {
        name: "La Bottega del Caffè",
        type: "cafe",
        city: "Rome",
        country: "Italy",
        image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80",
        description: "Tiny café in a Trastevere alley, serving the best espresso in town...",
        isHidden: true,
        priceRange: "$$"
    },
    {
        name: "The Blind Tiger",
        type: "bar",
        city: "New York",
        country: "USA",
        image: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&q=80",
        description: "Speakeasy bar behind an unmarked door. Cocktails from 1920s recipes...",
        isHidden: true,
        priceRange: "$$$"
    },
    {
        name: "Mercado de San Miguel",
        type: "market",
        city: "Madrid",
        country: "Spain",
        image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80",
        description: "Historic market with the best tapas and jamón from local producers...",
        isHidden: false,
        priceRange: "$$"
    },
    {
        name: "Sushi Dai",
        type: "restaurant",
        city: "Tokyo",
        country: "Japan",
        image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&q=80",
        description: "Small 12-seat sushi bar right at the fish market. Morning only...",
        isHidden: true,
        priceRange: "$$$"
    }
];

const typeLabels = {
    cafe: "Café",
    bar: "Bar",
    restaurant: "Restaurant",
    market: "Market"
};

export default function LocationsPreview() {
    const [currentIndex, setCurrentIndex] = useState(0);

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % previewLocations.length);
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + previewLocations.length) % previewLocations.length);
    };

    return (
        <section id="locations" className="py-32 px-6 relative overflow-hidden font-sans">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12 md:mb-20 px-2">
                    <motion.h2 
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-3xl md:text-6xl font-semibold tracking-tight mb-4 md:mb-6 leading-tight"
                    >
                        <span className="text-neutral-900">Peek into the </span>
                        <span className="text-blue-600">collection.</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-neutral-900 mt-4 md:mt-6 max-w-2xl mx-auto text-base md:text-xl font-medium leading-relaxed"
                    >
                        Just a small preview. Full access unlocks hundreds of unique places.
                    </motion.p>
                </div>

                {/* Mobile Carousel */}
                <div className="md:hidden relative">
                    <div className="relative aspect-[3/4] rounded-[2.5rem] overflow-hidden shadow-2xl">
                        <LocationCard location={previewLocations[currentIndex]} />
                    </div>
                    
                    <div className="flex justify-center items-center gap-4 mt-8">
                        <Button 
                            variant="secondary" 
                            size="icon"
                            onClick={prevSlide}
                            className="rounded-full w-12 h-12 bg-neutral-100 hover:bg-neutral-200"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                        <div className="flex gap-2">
                            {previewLocations.map((_, i) => (
                                <div 
                                    key={i}
                                    className={`h-2 rounded-full transition-all duration-300 ${
                                        i === currentIndex ? 'w-8 bg-blue-600' : 'w-2 bg-neutral-200'
                                    }`}
                                />
                            ))}
                        </div>
                        <Button 
                            variant="secondary" 
                            size="icon"
                            onClick={nextSlide}
                            className="rounded-full w-12 h-12 bg-neutral-100 hover:bg-neutral-200"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                {/* Desktop Grid */}
                <div className="hidden md:grid md:grid-cols-2 gap-8">
                    {previewLocations.map((location, index) => (
                        <LocationCard key={index} location={location} index={index} />
                    ))}
                </div>
            </div>
        </section>
    );
}

function LocationCard({ location, index = 0 }) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="group relative aspect-[3/4] md:aspect-[4/3] rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer"
        >
            <img 
                src={location.image} 
                alt={location.name}
                className="w-full h-full object-cover transition-transform duration-700"
                style={{ transform: isHovered ? 'scale(1.05)' : 'scale(1)' }}
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />
            
            <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-between">
                <div className="flex items-start justify-between">
                    <div className="flex flex-wrap gap-2">
                        <Badge className="bg-white/20 text-white backdrop-blur-md border-0 px-3 md:px-4 py-1 md:py-1.5 text-xs md:text-sm font-medium">
                            {typeLabels[location.type]}
                        </Badge>
                        {location.isHidden && (
                            <Badge className="bg-blue-600 text-white border-0 px-3 md:px-4 py-1 md:py-1.5 text-xs md:text-sm font-medium shadow-lg shadow-blue-500/30">
                                <Star className="w-3 h-3 mr-1 fill-current" />
                                Hidden Gem
                            </Badge>
                        )}
                    </div>
                </div>

                <div className="relative z-10">
                    <h3 className="text-2xl md:text-3xl font-semibold text-white mb-2 tracking-tight leading-tight line-clamp-2">
                        {location.name}
                    </h3>
                    
                    <div className="flex items-center text-white/90 text-xs md:text-sm mb-3 md:mb-4 font-medium flex-wrap gap-y-1">
                        <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2 shrink-0" />
                        <span className="truncate max-w-[150px]">{location.city}, {location.country}</span>
                        <span className="mx-2 md:mx-3 text-white/40">•</span>
                        <span className="text-white">{location.priceRange}</span>
                    </div>

                    <p className="text-white/80 text-sm md:text-base leading-relaxed mb-4 md:mb-6 max-w-md line-clamp-3">
                        {location.description}
                    </p>

                    {/* Button - visible on hover for desktop */}
                    <div className="hidden md:block">
                        {isHovered && (
                            <div className="absolute bottom-8 right-8">
                                <Link to={createPageUrl("Pricing")}>
                                    <Button className="bg-white text-neutral-900 hover:bg-neutral-100 rounded-full h-12 px-6 shadow-xl">
                                        Learn More
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}