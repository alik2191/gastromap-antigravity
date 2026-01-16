import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import HeroSection from '../components/landing/HeroSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import LocationsPreview from '../components/landing/LocationsPreview';
import PricingSection from '../components/landing/PricingSection';
import FAQSection from '../components/landing/FAQSection';
import Footer from '../components/landing/Footer';

export default function Home() {
    // Set to false to return to normal white background
    const useAnimatedBackground = true;

    return (
        <>
            <style dangerouslySetInnerHTML={{
                __html: `
                    /* Isolated reset for public page - Home */
                    #root, #root > * {
                        isolation: isolate;
                    }
                    html {
                        background: #ffffff !important;
                        overflow-x: hidden;
                    }
                    body {
                        background: #ffffff !important;
                        overflow-x: hidden;
                        min-height: 100dvh;
                    }
                    /* Fix for iOS Safari */
                    @supports (-webkit-touch-callout: none) {
                        html {
                            height: -webkit-fill-available;
                        }
                        body {
                            min-height: -webkit-fill-available;
                        }
                    }
                    @keyframes gradientMove {
                        0% { background-position: 0% 50%; }
                        50% { background-position: 100% 50%; }
                        100% { background-position: 0% 50%; }
                    }
                `
            }} />
            
            <div className="min-h-[100dvh] relative isolate">
                {useAnimatedBackground && (
                    <>
                        {/* Animated gradient background - Fixed and isolated */}
                        <div 
                            className="fixed inset-0"
                            style={{
                                zIndex: -1,
                                background: 'linear-gradient(-45deg, #ffffff, #dbeafe, #93c5fd, #60a5fa)',
                                backgroundSize: '400% 400%',
                                animation: 'gradientMove 15s ease infinite'
                            }}
                        />
                        {/* Frosted glass overlay */}
                        <div 
                            className="fixed inset-0"
                            style={{
                                zIndex: -1,
                                backdropFilter: 'blur(100px)',
                                WebkitBackdropFilter: 'blur(100px)',
                                backgroundColor: 'rgba(255, 255, 255, 0.7)'
                            }}
                        />
                    </>
                )}
                
                {!useAnimatedBackground && (
                    <div className="fixed inset-0 bg-white" style={{ zIndex: -1 }} />
                    )}

                    <HeroSection />
                <FeaturesSection />
                <LocationsPreview />
                <PricingSection />
                <FAQSection />
                <Footer />
            </div>
        </>
    );
}