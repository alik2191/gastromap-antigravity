import React, { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import { MessageSquare, Mail, Clock, CheckCircle, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { base44 } from '@/api/client';
import Header from '../components/landing/Header';
import Footer from '../components/landing/Footer';

export default function SupportPage() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [type, setType] = useState('general');
    const [message, setMessage] = useState('');
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const userData = await base44.auth.me();
                setUser(userData);
                setEmail(userData.email || '');
                setName(userData.full_name || '');
            } catch (e) {
                // User not logged in, that's ok
            }
        };
        checkAuth();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!message.trim()) {
            toast.error('Please fill in the message');
            return;
        }

        // Validate email for non-authenticated users
        if (!user && (!email.trim() || !email.includes('@'))) {
            toast.error('Please provide a valid email');
            return;
        }

        setLoading(true);
        try {
            await base44.entities.Feedback.create({
                user_email: email || 'anonymous',
                user_name: name || 'Anonymous',
                message: message.trim(),
                type,
                status: 'new'
            });
            toast.success('Thank you for reaching out! We will get back to you shortly.');
            setMessage('');
            setType('general');
            if (!user) {
                setEmail('');
                setName('');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error sending. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <style dangerouslySetInnerHTML={{
                __html: `
                    /* Isolated reset for public page - Support */
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
            
                <Header />

                {/* Hero Section */}
                <section className="pt-20 pb-12 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <MessageSquare className="w-8 h-8 text-blue-600" />
                        </div>
                        <h1 className="text-5xl md:text-6xl font-semibold tracking-tight leading-[1.1] mb-6">
                            <span className="text-blue-600">Support</span><span className="text-neutral-900"> GastroMap</span>
                        </h1>
                        <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
                            We're here to help you. Write to us and we'll respond as soon as possible.
                        </p>
                    </motion.div>
                </div>
                </section>

                {/* Contact Form */}
                <section className="pb-12 px-6">
                <div className="max-w-2xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-3xl p-8 hover:bg-white/80 transition-all"
                    >
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {!user && (
                                <>
                                    <div className="space-y-2">
                                        <Label className="text-neutral-900">Your Name</Label>
                                        <Input
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="John Smith"
                                            className="h-12 rounded-xl placeholder:text-neutral-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-neutral-900">Email *</Label>
                                        <Input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="your@email.com"
                                            required
                                            className="h-12 rounded-xl placeholder:text-neutral-500"
                                        />
                                    </div>
                                </>
                            )}

                            <div className="space-y-2">
                                <Label className="text-neutral-900">Request Type</Label>
                                <Select value={type} onValueChange={setType}>
                                    <SelectTrigger className="h-12 rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="general">General Question</SelectItem>
                                        <SelectItem value="bug">Report a Bug</SelectItem>
                                        <SelectItem value="feature">Suggest an Idea</SelectItem>
                                        <SelectItem value="partnership">Partnership</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-neutral-900">Message *</Label>
                                <Textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Tell us how we can help..."
                                    className="min-h-[180px] rounded-xl placeholder:text-neutral-500"
                                    required
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    'Send Message'
                                )}
                            </Button>
                        </form>
                    </motion.div>
                </div>
                </section>

                {/* Info Cards */}
                <section className="pb-20 px-6">
                <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-2xl p-6 text-center hover:bg-white/80 transition-all"
                    >
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                            <Clock className="w-6 h-6 text-blue-600" />
                        </div>
                        <h3 className="font-semibold mb-2">Quick Response</h3>
                        <p className="text-sm text-neutral-600">
                            Usually respond within 24 hours
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-2xl p-6 text-center hover:bg-white/80 transition-all"
                    >
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <h3 className="font-semibold mb-2">Problem Solving</h3>
                        <p className="text-sm text-neutral-600">
                            Help with any question
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-2xl p-6 text-center hover:bg-white/80 transition-all"
                    >
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                            <Mail className="w-6 h-6 text-purple-600" />
                        </div>
                        <h3 className="font-semibold mb-2">Email Support</h3>
                        <p className="text-sm text-neutral-600">
                            Available 24/7
                        </p>
                    </motion.div>
                </div>
                </section>

                <Footer />
            </div>
        </>
    );
}