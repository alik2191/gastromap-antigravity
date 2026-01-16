import React, { useState } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Sparkles, Wand2, MapPin, Tag, CheckCircle, 
    ArrowRight, ArrowLeft, X 
} from "lucide-react";

const steps = [
    {
        id: 1,
        icon: Sparkles,
        iconColor: "text-blue-600",
        bgColor: "bg-blue-50",
        title: "Welcome, Creator!",
        description: "Let's quickly walk through how to add amazing locations to GastroMap. This will only take a minute!",
        highlight: "You'll discover powerful AI tools that make adding locations super easy.",
        image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80"
    },
    {
        id: 2,
        icon: Wand2,
        iconColor: "text-purple-600",
        bgColor: "bg-purple-50",
        title: "Smart Fill with AI",
        description: "Just paste a location name or link (Google Maps, Instagram, website) and AI will automatically fill all fields for you!",
        highlight: "AI searches multiple sources: Google Maps, social media, reviews, and official websites.",
        features: ["Auto-fills name, address, coordinates", "Finds photos and social links", "Extracts popular menu items"]
    },
    {
        id: 3,
        icon: Sparkles,
        iconColor: "text-pink-600",
        bgColor: "bg-pink-50",
        title: "Descriptions: Be Specific & Detailed",
        description: "Good descriptions help AI Guide match locations to user requests! Mention atmosphere, specialties, popular dishes, and unique features.",
        highlight: "Example: Instead of 'Nice cafe' write 'Cozy cafe with specialty coffee, homemade croissants, and outdoor seating. Famous for their cinnamon rolls and cappuccino art.'",
        features: [
            "Mention signature dishes and drinks explicitly",
            "Describe the atmosphere (cozy, lively, romantic, modern)",
            "Include what makes this place special and unique"
        ]
    },
    {
        id: 4,
        icon: MapPin,
        iconColor: "text-green-600",
        bgColor: "bg-green-50",
        title: "Precise Location on Map",
        description: "Click on the interactive map to set exact coordinates. This helps users navigate to the venue easily.",
        highlight: "Or let Smart Fill do it automatically from Google Maps!",
        features: ["Interactive map picker", "Manual coordinate input", "Auto-filled from search"]
    },
    {
        id: 5,
        icon: Tag,
        iconColor: "text-amber-600",
        bgColor: "bg-amber-50",
        title: "Tags & Special Features: The Secret to Visibility",
        description: "THIS IS CRUCIAL! Tags and special features help AI Guide recommend your location accurately to users. The better you fill these, the more visitors you'll get!",
        highlight: "Example: A cafe with great desserts needs tags like 'homemade pastries', 'best cheesecake' AND special label 'tastyDesserts'",
        features: [
            "Use ALL relevant special labels (pet-friendly, live music, etc.)",
            "Add 5-10 keyword tags describing unique features",
            "Be specific: 'signature tiramisu' better than just 'desserts'"
        ]
    },
    {
        id: 6,
        icon: CheckCircle,
        iconColor: "text-blue-600",
        bgColor: "bg-blue-50",
        title: "Quality Checklist Before Submitting",
        description: "Before hitting submit, make sure you've filled these key fields to maximize your location's visibility!",
        highlight: "✅ Complete profile = More visitors through AI Guide recommendations",
        features: [
            "✓ Description mentions signature items & atmosphere",
            "✓ 'Must Try' field filled with specific dishes/drinks",
            "✓ At least 5 tags + relevant special labels selected",
            "✓ Photos uploaded (shows location's vibe)",
            "✓ Contact info & hours added for user convenience"
        ]
    }
];

export default function CreatorOnboardingGuide({ isOpen, onComplete, onSkip }) {
    const [currentStep, setCurrentStep] = useState(0);
    const step = steps[currentStep];
    const StepIcon = step.icon;
    const isLastStep = currentStep === steps.length - 1;
    const isFirstStep = currentStep === 0;

    const handleNext = () => {
        if (isLastStep) {
            onComplete();
        } else {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        if (!isFirstStep) {
            setCurrentStep(prev => prev - 1);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={() => {}}>
            <DialogContent 
                className="max-w-2xl p-0 overflow-hidden border-none shadow-2xl"
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step.id}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.3 }}
                        className="relative"
                    >
                        {/* Skip Button */}
                        <button
                            onClick={onSkip}
                            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center text-neutral-600 hover:text-neutral-900 transition-colors shadow-sm"
                            aria-label="Skip onboarding"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        {/* Hero Image/Icon Section */}
                        <div className={`relative h-48 md:h-64 ${step.bgColor} flex items-center justify-center overflow-hidden`}>
                            {step.image ? (
                                <>
                                    <img 
                                        src={step.image} 
                                        alt={step.title}
                                        className="absolute inset-0 w-full h-full object-cover opacity-30"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/50" />
                                </>
                            ) : null}
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                                className="relative z-10"
                            >
                                <div className={`w-20 h-20 md:w-24 md:h-24 rounded-full bg-white shadow-xl flex items-center justify-center`}>
                                    <StepIcon className={`w-10 h-10 md:w-12 md:h-12 ${step.iconColor}`} />
                                </div>
                            </motion.div>
                        </div>

                        {/* Content Section */}
                        <div className="p-6 md:p-8">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-3">
                                    {step.title}
                                </h2>
                                <p className="text-neutral-600 text-base md:text-lg mb-4 leading-relaxed">
                                    {step.description}
                                </p>

                                {/* Highlight Box */}
                                <div className={`${step.bgColor} rounded-xl p-4 mb-6 border-l-4 ${step.iconColor.replace('text-', 'border-')}`}>
                                    <p className="text-sm md:text-base font-medium text-neutral-800">
                                        💡 {step.highlight}
                                    </p>
                                </div>

                                {/* Features List */}
                                {step.features && (
                                    <div className="space-y-2 mb-6">
                                        {step.features.map((feature, idx) => (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.4 + idx * 0.1 }}
                                                className="flex items-start gap-3"
                                            >
                                                <CheckCircle className={`w-5 h-5 ${step.iconColor} shrink-0 mt-0.5`} />
                                                <span className="text-neutral-700 text-sm md:text-base">{feature}</span>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>

                            {/* Progress Dots */}
                            <div className="flex justify-center gap-2 mb-6">
                                {steps.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentStep(idx)}
                                        className={`h-2 rounded-full transition-all ${
                                            idx === currentStep 
                                                ? 'w-8 bg-blue-600' 
                                                : idx < currentStep 
                                                    ? 'w-2 bg-blue-300'
                                                    : 'w-2 bg-neutral-300'
                                        }`}
                                        aria-label={`Go to step ${idx + 1}`}
                                    />
                                ))}
                            </div>

                            {/* Navigation Buttons */}
                            <div className="flex gap-3">
                                <Button
                                    onClick={handleBack}
                                    variant="outline"
                                    disabled={isFirstStep}
                                    className="flex-1 h-12 rounded-xl"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back
                                </Button>
                                <Button
                                    onClick={handleNext}
                                    className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    {isLastStep ? "Let's Start!" : "Next"}
                                    {!isLastStep && <ArrowRight className="w-4 h-4 ml-2" />}
                                </Button>
                            </div>

                            {/* Step Counter - Mobile Only */}
                            <p className="text-center text-xs text-neutral-500 mt-4 md:hidden">
                                Step {currentStep + 1} of {steps.length}
                            </p>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    );
}