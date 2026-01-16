import React from 'react';
import { MapPin, Instagram, Send, Mail, Twitter, Facebook, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

export default function Footer() {
    return (
        <footer className="bg-neutral-950 text-white py-20 px-6 relative overflow-hidden font-sans">
            <div className="max-w-7xl mx-auto relative">
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8 }}
                    className="grid md:grid-cols-2 lg:grid-cols-12 gap-12 mb-16"
                >
                    {/* Brand */}
                    <div className="lg:col-span-5">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-blue-900/20">
                                G
                            </div>
                            <span className="text-2xl font-semibold tracking-tight">GastroMap</span>
                        </div>
                        <p className="text-neutral-400 leading-relaxed max-w-sm mb-8 font-medium">
                            Your personal guide to hidden culinary gems around the world. 
                            Discover local secrets with us.
                        </p>
                        
                        {/* Social Links */}
                        <div className="flex gap-4">
                            <motion.a 
                                whileHover={{ scale: 1.1, y: -2 }}
                                href="https://www.instagram.com/gastromap.app/" 
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                            >
                                <Instagram className="w-5 h-5" />
                            </motion.a>
                            <motion.a 
                                whileHover={{ scale: 1.1, y: -2 }}
                                href="#" 
                                className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                            >
                                <Twitter className="w-5 h-5" />
                            </motion.a>
                            <motion.a 
                                whileHover={{ scale: 1.1, y: -2 }}
                                href="#" 
                                className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                            >
                                <Facebook className="w-5 h-5" />
                            </motion.a>
                        </div>
                    </div>

                    {/* Links */}
                    <div className="lg:col-span-2">
                        <h4 className="font-semibold mb-6 text-white tracking-tight">Navigation</h4>
                        <ul className="space-y-4 text-neutral-400 font-medium">
                            <li><Link to={createPageUrl("Home")} className="hover:text-white transition-colors">Home</Link></li>
                            <li><Link to={createPageUrl("Home") + "#locations"} className="hover:text-white transition-colors">Locations</Link></li>
                            <li><Link to={createPageUrl("Pricing")} className="hover:text-white transition-colors">Pricing</Link></li>
                        </ul>
                    </div>

                    <div className="lg:col-span-2">
                        <h4 className="font-semibold mb-6 text-white tracking-tight">Help</h4>
                        <ul className="space-y-4 text-neutral-400 font-medium">
                            <li><Link to={createPageUrl("Home") + "#faq"} className="hover:text-white transition-colors">FAQ</Link></li>
                            <li><Link to={createPageUrl('Support')} className="hover:text-white transition-colors">Support</Link></li>
                        </ul>
                    </div>

                    <div className="lg:col-span-3">
                        <h4 className="font-semibold mb-6 text-white tracking-tight">Newsletter</h4>
                        <p className="text-neutral-400 text-sm mb-4 font-medium">
                            Exclusive offers and new places
                        </p>
                        <div className="flex gap-2">
                            <input 
                                type="email" 
                                placeholder="Email"
                                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-600/50 text-sm font-medium"
                            />
                            <button className="px-4 py-3 bg-blue-600 rounded-2xl hover:bg-blue-500 transition-colors text-white font-medium">
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Bottom */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-neutral-500 text-sm font-medium"
                >
                    <p>© {new Date().getFullYear()} GastroMap. All rights reserved.</p>
                    <div className="flex gap-8">
                        <Link to={createPageUrl("Privacy")} className="hover:text-white transition-colors">Privacy</Link>
                        <Link to={createPageUrl("Terms")} className="hover:text-white transition-colors">Terms of Use</Link>
                    </div>
                </motion.div>
            </div>
        </footer>
    );
}