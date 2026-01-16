// Pricing Page
import { router } from '../utils/router.js';
import { appState } from '../utils/state.js';
import { PLAN_FEATURES, SUBSCRIPTION_TIERS } from '../utils/subscriptionManager.js';
import { renderNavbar } from '../components/Navbar.js';

export function renderPricingPage(message = null) {
    const state = appState.getState();
    const app = document.getElementById('app');

    app.innerHTML = `
        ${renderNavbar()}
        
        <div class="pricing-page">
            <div class="pricing-header">
                <div class="container">
                    ${message ? `
                        <div class="pricing-message">
                            <p>${message}</p>
                        </div>
                    ` : ''}
                    
                    <h1 class="pricing-title">Choose Your Plan</h1>
                    <p class="pricing-subtitle">
                        Start tracking your culinary journey today. Upgrade anytime.
                    </p>
                </div>
            </div>
            
            <div class="pricing-content">
                <div class="container">
                    <div class="pricing-grid">
                        ${renderPricingCard(SUBSCRIPTION_TIERS.FREE)}
                        ${renderPricingCard(SUBSCRIPTION_TIERS.BASIC)}
                        ${renderPricingCard(SUBSCRIPTION_TIERS.PREMIUM)}
                        ${renderPricingCard(SUBSCRIPTION_TIERS.PRO)}
                    </div>
                    
                    <!-- Feature Comparison Table -->
                    <div class="feature-comparison">
                        <h2 style="text-align: center; margin-bottom: var(--space-8);">
                            Compare All Features
                        </h2>
                        
                        <div class="comparison-table card">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Feature</th>
                                        <th>Free</th>
                                        <th>Basic</th>
                                        <th>Premium</th>
                                        <th>Pro</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td><strong>Locations</strong></td>
                                        <td>5/month</td>
                                        <td>50/month</td>
                                        <td>Unlimited</td>
                                        <td>Unlimited</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Map View</strong></td>
                                        <td>✓</td>
                                        <td>✓</td>
                                        <td>✓</td>
                                        <td>✓</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Search & Filters</strong></td>
                                        <td>-</td>
                                        <td>✓</td>
                                        <td>✓</td>
                                        <td>✓</td>
                                    </tr>
                                    <tr>
                                        <td><strong>AI Guide</strong></td>
                                        <td>-</td>
                                        <td>10/month</td>
                                        <td>100/month</td>
                                        <td>Unlimited</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Achievements</strong></td>
                                        <td>-</td>
                                        <td>Basic</td>
                                        <td>Full</td>
                                        <td>Full</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Analytics</strong></td>
                                        <td>-</td>
                                        <td>-</td>
                                        <td>✓</td>
                                        <td>✓</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Export Data</strong></td>
                                        <td>-</td>
                                        <td>5/month</td>
                                        <td>Unlimited</td>
                                        <td>Unlimited</td>
                                    </tr>
                                    <tr>
                                        <td><strong>API Access</strong></td>
                                        <td>-</td>
                                        <td>-</td>
                                        <td>-</td>
                                        <td>10k req/mo</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Team Features</strong></td>
                                        <td>-</td>
                                        <td>-</td>
                                        <td>-</td>
                                        <td>Up to 5 users</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Support</strong></td>
                                        <td>Community</td>
                                        <td>Email</td>
                                        <td>Priority</td>
                                        <td>Dedicated</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <!-- FAQ Section -->
                    <div class="faq-section">
                        <h2 style="text-align: center; margin-bottom: var(--space-8);">
                            Frequently Asked Questions
                        </h2>
                        
                        <div class="faq-grid">
                            <div class="faq-item card">
                                <h3>Can I change plans later?</h3>
                                <p>Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
                            </div>
                            
                            <div class="faq-item card">
                                <h3>What payment methods do you accept?</h3>
                                <p>We accept all major credit cards, debit cards, and PayPal.</p>
                            </div>
                            
                            <div class="faq-item card">
                                <h3>Can I cancel anytime?</h3>
                                <p>Absolutely. Cancel your subscription anytime with no questions asked.</p>
                            </div>
                            
                            <div class="faq-item card">
                                <h3>Is there a free trial?</h3>
                                <p>The Free tier gives you access to core features. Paid plans start immediately upon purchase.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderPricingCard(tier) {
    const plan = PLAN_FEATURES[tier];
    const state = appState.getState();
    const currentTier = state.subscription?.tier;
    const isCurrentPlan = currentTier === tier;

    return `
        <div class="pricing-card ${plan.popular ? 'popular' : ''} ${isCurrentPlan ? 'current' : ''}">
            ${plan.popular ? '<div class="pricing-badge">Most Popular</div>' : ''}
            ${isCurrentPlan ? '<div class="pricing-badge current">Current Plan</div>' : ''}
            
            <div class="pricing-card-header">
                <h3 class="pricing-card-title">${plan.name}</h3>
                <div class="pricing-card-price">
                    ${tier === SUBSCRIPTION_TIERS.FREE ?
            '<span class="price">Free</span>' :
            `
                            <span class="currency">$</span>
                            <span class="price">${plan.price}</span>
                            <span class="interval">/${plan.interval}</span>
                        `
        }
                </div>
            </div>
            
            <ul class="pricing-features">
                ${plan.features.map(feature => `
                    <li class="feature-item">
                        <span class="feature-icon">✓</span>
                        ${feature}
                    </li>
                `).join('')}
                
                ${plan.locked.length > 0 ? `
                    ${plan.locked.map(feature => `
                        <li class="feature-item locked">
                            <span class="feature-icon">-</span>
                            ${feature}
                        </li>
                    `).join('')}
                ` : ''}
            </ul>
            
            <button class="btn ${plan.popular ? 'btn-primary' : 'btn-outline'} pricing-cta"
                    ${isCurrentPlan ? 'disabled' : ''}
                    onclick="window.selectPlan('${tier}')">
                ${isCurrentPlan ? 'Current Plan' :
            tier === SUBSCRIPTION_TIERS.FREE ? 'Get Started' : 'Subscribe Now'}
            </button>
        </div>
    `;
}

// Global function to select plan
if (typeof window !== 'undefined') {
    window.selectPlan = (tier) => {
        const state = appState.getState();

        if (tier === SUBSCRIPTION_TIERS.FREE) {
            // For free tier, just go to signup if not authenticated
            if (!state.isAuthenticated) {
                router.navigate('/signup');
            } else {
                router.navigate('/dashboard');
            }
            return;
        }

        // For paid tiers, check authentication
        if (!state.isAuthenticated) {
            // Need to signup first
            sessionStorage.setItem('selectedPlan', tier);
            router.navigate('/signup');
        } else {
            // Show payment modal
            showPaymentModal(tier);
        }
    };
}

function showPaymentModal(tier) {
    // This will be implemented in PaymentModal.js
    const event = new CustomEvent('showPayment', { detail: { tier } });
    window.dispatchEvent(event);
}
