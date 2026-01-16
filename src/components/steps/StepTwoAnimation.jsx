import React from "react";
import { motion } from "framer-motion";
import { Heart, Bookmark, Star } from "lucide-react";

export default function StepTwoAnimation() {
    return (
        <div className="relative w-full h-64 bg-gradient-to-br from-[#3498DB]/10 to-[#2980B9]/10 rounded-3xl overflow-hidden flex items-center justify-center">
            {/* Mini location card */}
            <motion.div
                className="relative w-48 bg-white rounded-2xl shadow-xl overflow-hidden"
                animate={{ scale: [1, 1.02, 1], y: [0, -5, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 0.5 }}
            >
                {/* Card image */}
                <div className="h-32 bg-gradient-to-br from-[#3498DB] to-[#2980B9]" />
                
                {/* Card content */}
                <div className="p-4">
                    <div className="h-3 bg-[#2C3E50]/20 rounded mb-2 w-3/4" />
                    <div className="h-2 bg-[#2C3E50]/10 rounded w-1/2" />
                </div>

                {/* Animated Heart (Save) */}
                <motion.div
                    className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg"
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
                >
                    <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                </motion.div>

                {/* Animated Bookmark */}
                <motion.div
                    className="absolute top-14 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.8, delay: 0.3 }}
                >
                    <Bookmark className="w-4 h-4 text-[#3498DB] fill-[#3498DB]" />
                </motion.div>
            </motion.div>

            {/* Floating stars */}
            {[
                { x: "15%", y: "20%", delay: 0 },
                { x: "80%", y: "25%", delay: 0.5 },
                { x: "85%", y: "70%", delay: 1 }
            ].map((star, i) => (
                <motion.div
                    key={i}
                    className="absolute"
                    style={{ left: star.x, top: star.y }}
                    animate={{ 
                        scale: [1, 1.3, 1],
                        rotate: [0, 180, 360],
                        opacity: [0.6, 1, 0.6]
                    }}
                    transition={{ 
                        delay: star.delay,
                        duration: 3, 
                        repeat: Infinity,
                        repeatDelay: 0.5
                    }}
                >
                    <Star className="w-6 h-6 text-[#3498DB] fill-[#3498DB]" />
                </motion.div>
            ))}
        </div>
    );
}