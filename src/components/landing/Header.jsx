import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";

export default function Header() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        base44.auth.me()
            .then(setUser)
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const handleLogin = () => {
        base44.auth.redirectToLogin(createPageUrl("AuthCallback"));
    };

    return (
        <motion.nav 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="fixed top-0 left-0 right-0 z-50 px-6 pt-4 pb-4"
        >
            <div className="max-w-7xl mx-auto bg-white/80 backdrop-blur-xl rounded-full px-6 py-3 flex items-center justify-between border border-white/20 shadow-sm">
                <Link to={createPageUrl("Home")} className="flex items-center gap-2" aria-label="GastroMap - На главную">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold" aria-hidden="true">
                        G
                    </div>
                    <span className="font-semibold text-lg tracking-tight text-neutral-900">GastroMap</span>
                </Link>
                
                <div className="flex items-center gap-4">
                    {!loading && (
                        <>
                            {user ? (
                                 <Link to={createPageUrl("Dashboard")}>
                                    <Button className="rounded-full bg-neutral-900 hover:bg-neutral-800 text-white px-6">
                                        Dashboard
                                    </Button>
                                 </Link>
                            ) : (
                                <>
                                    <Button 
                                        onClick={handleLogin}
                                        variant="ghost" 
                                        className="rounded-full font-medium text-neutral-900 hover:bg-neutral-100"
                                    >
                                        Sign In
                                    </Button>
                                    <Link to={createPageUrl("Pricing")}>
                                        <Button className="rounded-full bg-blue-600 hover:bg-blue-700 text-white px-6 shadow-lg shadow-blue-200">
                                            Get Started
                                        </Button>
                                    </Link>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </motion.nav>
    );
}