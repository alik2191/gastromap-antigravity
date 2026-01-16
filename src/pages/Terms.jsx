import React, { useEffect } from 'react';
import Header from '../components/landing/Header';
import Footer from '../components/landing/Footer';
import { motion } from "framer-motion";

export default function Terms() {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <>
            <style dangerouslySetInnerHTML={{
                __html: `
                  /* Isolated reset for public page - Terms */
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
                        <span className="text-blue-600">Terms</span><span className="text-neutral-900"> of Use</span>
                    </h1>
                    <p className="text-neutral-500 mb-12 text-lg">Last updated: December 11, 2024</p>

                    <div className="space-y-6">
                        <motion.section 
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-2xl p-8 hover:bg-white/80 transition-all"
                        >
                            <h2 className="text-2xl font-semibold mb-4 text-neutral-900">1. Acceptance of Terms</h2>
                            <p className="text-neutral-600 leading-relaxed">
                                By using GastroGuide, you agree to these Terms of Use. 
                                If you do not agree to these terms, please do not use our service.
                            </p>
                        </motion.section>

                        <motion.section 
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-2xl p-8 hover:bg-white/80 transition-all"
                        >
                            <h2 className="text-2xl font-semibold mb-4 text-neutral-900">2. Service Description</h2>
                            <p className="text-neutral-600 leading-relaxed">
                                GastroGuide provides a platform for finding and saving information about restaurants, 
                                cafes and other gastronomic establishments worldwide.
                            </p>
                        </motion.section>

                        <motion.section 
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-2xl p-8 hover:bg-white/80 transition-all"
                        >
                            <h2 className="text-2xl font-semibold mb-4 text-neutral-900">3. Account Registration</h2>
                            <p className="text-neutral-600 leading-relaxed mb-4">When creating an account, you agree to:</p>
                            <ul className="space-y-3 text-neutral-600">
                                <li className="flex gap-3"><span className="text-blue-600 font-bold">•</span><div>Provide accurate and up-to-date information</div></li>
                                <li className="flex gap-3"><span className="text-blue-600 font-bold">•</span><div>Maintain the security of your password</div></li>
                                <li className="flex gap-3"><span className="text-blue-600 font-bold">•</span><div>Be responsible for all activity in your account</div></li>
                                <li className="flex gap-3"><span className="text-blue-600 font-bold">•</span><div>Immediately notify us of any unauthorized use</div></li>
                            </ul>
                        </motion.section>

                        <motion.section 
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 }}
                            className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-2xl p-8 hover:bg-white/80 transition-all"
                        >
                            <h2 className="text-2xl font-semibold mb-4 text-neutral-900">4. Subscriptions and Payments</h2>
                            <p className="text-neutral-600 leading-relaxed mb-4">
                                Some features require a paid subscription. Subscription terms:
                            </p>
                            <ul className="space-y-3 text-neutral-600">
                                <li className="flex gap-3"><span className="text-blue-600 font-bold">•</span><div>Payment is made in advance for the selected period</div></li>
                                <li className="flex gap-3"><span className="text-blue-600 font-bold">•</span><div>Automatic renewal unless cancelled in advance</div></li>
                                <li className="flex gap-3"><span className="text-blue-600 font-bold">•</span><div>Refunds available within 14 days of purchase</div></li>
                                <li className="flex gap-3"><span className="text-blue-600 font-bold">•</span><div>Prices may change with user notification</div></li>
                            </ul>
                        </motion.section>

                        <motion.section 
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.4 }}
                            className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-2xl p-8 hover:bg-white/80 transition-all"
                        >
                            <h2 className="text-2xl font-semibold mb-4 text-neutral-900">5. User Content</h2>
                            <p className="text-neutral-600 leading-relaxed mb-4">
                                By posting content (reviews, notes, photos), you:
                            </p>
                            <ul className="space-y-3 text-neutral-600">
                                <li className="flex gap-3"><span className="text-blue-600 font-bold">•</span><div>Retain all rights to your content</div></li>
                                <li className="flex gap-3"><span className="text-blue-600 font-bold">•</span><div>Grant us a license to use the content within the service</div></li>
                                <li className="flex gap-3"><span className="text-blue-600 font-bold">•</span><div>Guarantee that the content does not violate third-party rights</div></li>
                                <li className="flex gap-3"><span className="text-blue-600 font-bold">•</span><div>Accept responsibility for posted content</div></li>
                            </ul>
                        </motion.section>

                        <motion.section 
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.5 }}
                            className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-2xl p-8 hover:bg-white/80 transition-all"
                        >
                            <h2 className="text-2xl font-semibold mb-4 text-neutral-900">6. Prohibited Use</h2>
                            <p className="text-neutral-600 leading-relaxed mb-4">You are prohibited from:</p>
                            <ul className="space-y-3 text-neutral-600">
                                <li className="flex gap-3"><span className="text-blue-600 font-bold">•</span><div>Using the service for illegal purposes</div></li>
                                <li className="flex gap-3"><span className="text-blue-600 font-bold">•</span><div>Posting offensive, defamatory or illegal content</div></li>
                                <li className="flex gap-3"><span className="text-blue-600 font-bold">•</span><div>Attempting to gain unauthorized access to the system</div></li>
                                <li className="flex gap-3"><span className="text-blue-600 font-bold">•</span><div>Copying or distributing content without permission</div></li>
                                <li className="flex gap-3"><span className="text-blue-600 font-bold">•</span><div>Using automated means to collect data</div></li>
                            </ul>
                        </motion.section>

                        <motion.section 
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.6 }}
                            className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-2xl p-8 hover:bg-white/80 transition-all"
                        >
                            <h2 className="text-2xl font-semibold mb-4 text-neutral-900">7. Disclaimer of Warranties</h2>
                            <p className="text-neutral-600 leading-relaxed">
                                The service is provided "as is". We do not guarantee the accuracy of information about establishments 
                                and are not responsible for changes in their operations or characteristics.
                            </p>
                        </motion.section>

                        <motion.section 
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.7 }}
                            className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-2xl p-8 hover:bg-white/80 transition-all"
                        >
                            <h2 className="text-2xl font-semibold mb-4 text-neutral-900">8. Limitation of Liability</h2>
                            <p className="text-neutral-600 leading-relaxed">
                                We are not liable for indirect damages, lost profits or other 
                                indirect consequences of using the service.
                            </p>
                        </motion.section>

                        <motion.section 
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.8 }}
                            className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-2xl p-8 hover:bg-white/80 transition-all"
                        >
                            <h2 className="text-2xl font-semibold mb-4 text-neutral-900">9. Termination of Access</h2>
                            <p className="text-neutral-600 leading-relaxed">
                                We reserve the right to suspend or terminate your access to the service 
                                for violating these Terms of Use.
                            </p>
                        </motion.section>

                        <motion.section 
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.9 }}
                            className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-2xl p-8 hover:bg-white/80 transition-all"
                        >
                            <h2 className="text-2xl font-semibold mb-4 text-neutral-900">10. Changes to Terms</h2>
                            <p className="text-neutral-600 leading-relaxed">
                                We may modify these Terms of Use. We will notify users of significant changes 
                                via email or through service notifications.
                            </p>
                        </motion.section>

                        <motion.section 
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 1.0 }}
                            className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-2xl p-8 hover:bg-white/80 transition-all"
                        >
                            <h2 className="text-2xl font-semibold mb-4 text-neutral-900">11. Applicable Law</h2>
                            <p className="text-neutral-600 leading-relaxed">
                                These Terms are governed by the laws of the European Union and the country 
                                of company registration.
                            </p>
                        </motion.section>

                        <motion.section 
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 1.1 }}
                            className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-2xl p-8 hover:bg-white/80 transition-all"
                        >
                            <h2 className="text-2xl font-semibold mb-4 text-neutral-900">12. Contact</h2>
                            <p className="text-neutral-600 leading-relaxed">
                                For questions related to the Terms of Use, contact us at: 
                                <a href="mailto:legal@gastroguide.com" className="text-blue-600 hover:underline ml-1 font-medium">
                                    legal@gastroguide.com
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