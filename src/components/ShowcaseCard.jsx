import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ShowcaseCard({
    image,
    title,
    category,
    overview,
    description,
    tags = [],
    buttonText = "Preview",
    buttonLink
}) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <motion.div
            className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg overflow-hidden"
            initial={false}
            animate={{
                height: isExpanded ? "auto" : "360px"
            }}
            transition={{
                duration: 0.4,
                ease: [0.44, 0, 0.56, 1]
            }}
        >
            {/* Main Image Section */}
            <div className="relative h-[260px] overflow-hidden rounded-t-3xl">
                <img
                    src={image}
                    alt={title}
                    className="w-full h-full object-cover"
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />
                
                {/* Text Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end justify-between">
                    <div className="flex-1">
                        <h3 className="text-2xl font-bold text-white mb-1">{title}</h3>
                        <p className="text-white/80 text-sm">{category}</p>
                    </div>
                    
                    {!isExpanded && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 }}
                        >
                            <Button
                                onClick={buttonLink ? () => window.open(buttonLink, '_blank') : undefined}
                                className="bg-white/20 backdrop-blur-md text-white hover:bg-white/30 border-0 rounded-2xl px-6 h-auto py-3 text-sm font-semibold"
                            >
                                {buttonText}
                            </Button>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Expanded Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        className="p-6 bg-black/5"
                    >
                        <h4 className="text-lg font-semibold text-[#1A1A1A] mb-4">
                            {overview}
                        </h4>
                        
                        {/* Tags */}
                        {tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                                {tags.map((tag, index) => (
                                    <motion.span
                                        key={index}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.2 + index * 0.1 }}
                                        className="px-4 py-2 bg-black/10 text-[#2C2C2C] rounded-lg text-xs font-medium"
                                    >
                                        {tag}
                                    </motion.span>
                                ))}
                            </div>
                        )}
                        
                        {/* Description */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-[#2C2C2C] leading-relaxed text-sm"
                        >
                            {description}
                        </motion.p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full py-4 flex items-center justify-center hover:bg-black/5 transition-colors"
            >
                <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <ChevronDown className="w-6 h-6 text-[#2C2C2C]" />
                </motion.div>
            </button>
        </motion.div>
    );
}