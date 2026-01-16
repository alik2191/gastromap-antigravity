import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function CookieBanner() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        // Check if user has already accepted cookies
        const cookieConsent = localStorage.getItem('cookieConsent');
        if (!cookieConsent) {
            // Show banner after a short delay
            setTimeout(() => setShow(true), 1000);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('cookieConsent', 'accepted');
        setShow(false);
    };

    const handleDecline = () => {
        localStorage.setItem('cookieConsent', 'declined');
        setShow(false);
    };

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:max-w-md z-50"
                >
                    <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200 p-5">
                        <div className="flex items-start gap-3 mb-4">
                            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center shrink-0">
                                <Cookie className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-neutral-900 mb-1">We use cookies</h3>
                                <p className="text-sm text-neutral-600 leading-relaxed">
                                    We use cookies to enhance your browsing experience, analyze site traffic, and personalize content. By clicking "Accept", you consent to our use of cookies.
                                </p>
                            </div>
                            <button 
                                onClick={handleDecline}
                                className="text-neutral-400 hover:text-neutral-600 transition-colors"
                                aria-label="Close cookie banner"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <Button 
                                onClick={handleAccept}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                            >
                                Accept All
                            </Button>
                            <Button 
                                variant="outline"
                                onClick={handleDecline}
                                className="flex-1 rounded-xl"
                            >
                                Decline
                            </Button>
                            <Link to={createPageUrl('Privacy')} className="flex-1">
                                <Button 
                                    variant="outline"
                                    className="w-full rounded-xl text-sm bg-white border-neutral-900 text-neutral-900 hover:bg-neutral-900 hover:text-white transition-all"
                                >
                                    Learn More
                                </Button>
                            </Link>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}