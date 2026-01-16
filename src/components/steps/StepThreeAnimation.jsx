import React from "react";
import { motion } from "framer-motion";
import { Camera, MessageCircle, Share2, Star } from "lucide-react";

export default function StepThreeAnimation() {
    return (
        <div className="relative w-full h-64 bg-gradient-to-br from-[#3498DB]/10 to-[#2980B9]/10 rounded-3xl overflow-hidden flex items-center justify-center">
            {/* Center photo frame */}
            <motion.div
                className="relative w-40 h-40 bg-white rounded-2xl shadow-2xl overflow-hidden"
                animate={{ 
                    rotate: [6, -3, 6],
                    scale: [1, 1.05, 1]
                }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 0.5 }}
            >
                <div className="w-full h-full bg-gradient-to-br from-[#3498DB] to-[#2980B9]" />
                
                {/* Camera icon overlay */}
                <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    <Camera className="w-12 h-12 text-white/50" />
                </motion.div>
            </motion.div>

            {/* Floating review bubble */}
            <motion.div
                className="absolute bottom-12 left-8 bg-white rounded-2xl shadow-xl p-3 max-w-[140px]"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            >
                <div className="flex gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                        <motion.div
                            key={i}
                            animate={{ 
                                scale: [1, 1.2, 1],
                                rotate: [0, 10, 0]
                            }}
                            transition={{ 
                                delay: i * 0.1,
                                duration: 1.5, 
                                repeat: Infinity,
                                repeatDelay: 2
                            }}
                        >
                            <Star className="w-3 h-3 text-[#3498DB] fill-[#3498DB]" />
                        </motion.div>
                    ))}
                </div>
                <div className="h-2 bg-[#2C3E50]/10 rounded mb-1" />
                <div className="h-2 bg-[#2C3E50]/10 rounded w-3/4" />
            </motion.div>

            {/* Share icon */}
            <motion.div
                className="absolute top-10 right-10 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg"
                animate={{ 
                    scale: [1, 1.15, 1],
                    rotate: [0, 15, 0]
                }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1.5 }}
            >
                <Share2 className="w-6 h-6 text-[#3498DB]" />
            </motion.div>

            {/* Comment bubble */}
            <motion.div
                className="absolute top-16 left-12 w-10 h-10 bg-[#3498DB] rounded-full flex items-center justify-center shadow-lg"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 1, delay: 0.5 }}
            >
                <MessageCircle className="w-5 h-5 text-white" />
            </motion.div>
        </div>
    );
}