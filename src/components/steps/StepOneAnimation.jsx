import React from "react";
import { motion } from "framer-motion";
import { Search, MapPin, Sparkles } from "lucide-react";

export default function StepOneAnimation() {
    return (
        <div className="relative w-full h-64 bg-gradient-to-br from-[#3498DB]/10 to-[#2980B9]/10 rounded-3xl overflow-hidden">
            {/* Animated search bar */}
            <motion.div
                className="absolute top-8 left-1/2 -translate-x-1/2 w-4/5 bg-white rounded-2xl shadow-lg p-4 flex items-center gap-3"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            >
                <Search className="w-5 h-5 text-[#3498DB]" />
                <motion.div
                    className="flex-1 h-4 bg-gradient-to-r from-[#3498DB]/20 to-transparent rounded"
                    animate={{ width: ["0%", "80%", "0%"] }}
                    transition={{ duration: 3, repeat: Infinity, repeatDelay: 0.5 }}
                />
            </motion.div>

            {/* Animated location pins */}
            {[
                { x: "20%", y: "45%", delay: 0 },
                { x: "50%", y: "55%", delay: 0.3 },
                { x: "75%", y: "50%", delay: 0.6 }
            ].map((pin, i) => (
                <motion.div
                    key={i}
                    className="absolute"
                    style={{ left: pin.x, top: pin.y }}
                    animate={{ 
                        scale: [1, 1.1, 1],
                        y: [0, -5, 0]
                    }}
                    transition={{ 
                        delay: pin.delay,
                        duration: 2, 
                        repeat: Infinity,
                        repeatDelay: 1
                    }}
                >
                    <div className="relative">
                        <MapPin className="w-8 h-8 text-[#3498DB] fill-[#3498DB]" />
                        <motion.div
                            className="absolute -top-1 -right-1 w-3 h-3 bg-[#3498DB] rounded-full"
                            animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        />
                    </div>
                </motion.div>
            ))}

            {/* AI Sparkle */}
            <motion.div
                className="absolute bottom-8 right-8"
                animate={{ rotate: [0, 360], scale: [1, 1.2, 1] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 1 }}
            >
                <Sparkles className="w-10 h-10 text-[#3498DB]" />
            </motion.div>
        </div>
    );
}