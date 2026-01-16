import React, { useEffect } from 'react';
import Header from '../components/landing/Header';
import Footer from '../components/landing/Footer';
import { motion } from "framer-motion";

export default function Privacy() {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <>
            <style dangerouslySetInnerHTML={{
                __html: `
                  /* Isolated reset for public page - Privacy */
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
                
                <main className="max-w-4xl mx-auto px-6 py-32">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.1] mb-4">
                        <span className="text-blue-600">Privacy</span> <span className="text-neutral-900">Policy</span>
                    </h1>
                    <p className="text-neutral-500 mb-12 text-lg">Last updated: December 11, 2024</p>

                    <div className="space-y-6">
                        <motion.section 
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-2xl p-8 hover:bg-white/80 transition-all"
                        >
                            <h2 className="text-2xl font-semibold mb-4 text-neutral-900">1. Introduction</h2>
                            <p className="text-neutral-600 leading-relaxed">
                                GastroGuide ("we", "our", "us") is committed to protecting the privacy of our users. 
                                This Privacy Policy explains how we collect, use, disclose and protect 
                                your information when using our service.
                            </p>
                        </motion.section>

                        <motion.section 
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-2xl p-8 hover:bg-white/80 transition-all"
                        >
                            <h2 className="text-2xl font-semibold mb-4 text-neutral-900">2. Data We Collect</h2>
                            <p className="text-neutral-600 leading-relaxed mb-4">We collect the following information:</p>
                            <ul className="space-y-3 text-neutral-600">
                                <li className="flex gap-3"><span className="text-blue-600 font-bold">•</span><div><strong>Personal information:</strong> name, email address upon registration</div></li>
                                <li className="flex gap-3"><span className="text-blue-600 font-bold">•</span><div><strong>Location data:</strong> saved places, personal notes, ratings</div></li>
                                <li className="flex gap-3"><span className="text-blue-600 font-bold">•</span><div><strong>Usage data:</strong> information about how you use our service</div></li>
                                <li className="flex gap-3"><span className="text-blue-600 font-bold">•</span><div><strong>Technical data:</strong> IP address, browser type, cookie data</div></li>
                            </ul>
                        </motion.section>

                        <motion.section 
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-2xl p-8 hover:bg-white/80 transition-all"
                        >
                            <h2 className="text-2xl font-semibold mb-4 text-neutral-900">3. How We Use Data</h2>
                            <p className="text-neutral-600 leading-relaxed mb-4">We use collected data to:</p>
                            <ul className="space-y-3 text-neutral-600">
                                <li className="flex gap-3"><span className="text-blue-600 font-bold">•</span><div>Provide and improve our services</div></li>
                                <li className="flex gap-3"><span className="text-blue-600 font-bold">•</span><div>Personalize your experience</div></li>
                                <li className="flex gap-3"><span className="text-blue-600 font-bold">•</span><div>Communicate with you about your account</div></li>
                                <li className="flex gap-3"><span className="text-blue-600 font-bold">•</span><div>Ensure service security</div></li>
                                <li className="flex gap-3"><span className="text-blue-600 font-bold">•</span><div>Comply with legal obligations</div></li>
                            </ul>
                        </motion.section>

                        <motion.section 
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 }}
                            className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-2xl p-8 hover:bg-white/80 transition-all"
                        >
                            <h2 className="text-2xl font-semibold mb-4 text-neutral-900">4. Data Storage</h2>
                            <p className="text-neutral-600 leading-relaxed">
                                Your data is stored on secure servers. We take reasonable measures to protect 
                                your information from unauthorized access, modification, disclosure or destruction.
                            </p>
                        </motion.section>

                        <motion.section 
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.4 }}
                            className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-2xl p-8 hover:bg-white/80 transition-all"
                        >
                            <h2 className="text-2xl font-semibold mb-4 text-neutral-900">5. Your Rights (GDPR)</h2>
                            <p className="text-neutral-600 leading-relaxed mb-4">In accordance with GDPR, you have the right to:</p>
                            <ul className="space-y-3 text-neutral-600">
                                <li className="flex gap-3"><span className="text-blue-600 font-bold">•</span><div><strong>Access:</strong> request a copy of your personal data</div></li>
                                <li className="flex gap-3"><span className="text-blue-600 font-bold">•</span><div><strong>Rectification:</strong> correct inaccurate data</div></li>
                                <li className="flex gap-3"><span className="text-blue-600 font-bold">•</span><div><strong>Erasure:</strong> request deletion of your data</div></li>
                                <li className="flex gap-3"><span className="text-blue-600 font-bold">•</span><div><strong>Restriction:</strong> restrict processing of your data</div></li>
                                <li className="flex gap-3"><span className="text-blue-600 font-bold">•</span><div><strong>Portability:</strong> obtain your data in a machine-readable format</div></li>
                                <li className="flex gap-3"><span className="text-blue-600 font-bold">•</span><div><strong>Objection:</strong> object to processing of your data</div></li>
                            </ul>
                        </motion.section>

                        <motion.section 
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.5 }}
                            className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-2xl p-8 hover:bg-white/80 transition-all"
                        >
                            <h2 className="text-2xl font-semibold mb-4 text-neutral-900">6. Cookies</h2>
                            <p className="text-neutral-600 leading-relaxed">
                                We use cookies to improve your experience. You can manage cookie settings 
                                through your browser settings. Note that disabling cookies may affect 
                                service functionality.
                            </p>
                        </motion.section>

                        <motion.section 
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.6 }}
                            className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-2xl p-8 hover:bg-white/80 transition-all"
                        >
                            <h2 className="text-2xl font-semibold mb-4 text-neutral-900">7. Third-Party Data Sharing</h2>
                            <p className="text-neutral-600 leading-relaxed">
                                We do not sell your personal data. We may share data only with trusted 
                                service providers who help us operate the service, provided they comply with 
                                confidentiality requirements.
                            </p>
                        </motion.section>

                        <motion.section 
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.7 }}
                            className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-2xl p-8 hover:bg-white/80 transition-all"
                        >
                            <h2 className="text-2xl font-semibold mb-4 text-neutral-900">8. Policy Changes</h2>
                            <p className="text-neutral-600 leading-relaxed">
                                We may update this Privacy Policy from time to time. We will notify you 
                                of any changes by posting the new Privacy Policy on this page.
                            </p>
                        </motion.section>

                        <motion.section 
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.8 }}
                            className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-2xl p-8 hover:bg-white/80 transition-all"
                        >
                            <h2 className="text-2xl font-semibold mb-4 text-neutral-900">9. Contact Us</h2>
                            <p className="text-neutral-600 leading-relaxed">
                                If you have questions about our Privacy Policy or wish to exercise 
                                your rights, contact us through the feedback form or at: 
                                <a href="mailto:privacy@gastroguide.com" className="text-blue-600 hover:underline ml-1 font-medium">
                                    privacy@gastroguide.com
                                </a>
                            </p>
                        </motion.section>
                    </div>
                </motion.div>
                </main>

                <Footer />
            </div>
        </>
    );
}