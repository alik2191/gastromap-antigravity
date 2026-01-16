// Paywall Component - shown when accessing protected routes without subscription
import { router } from '../utils/router.js';
import { PLAN_FEATURES, SUBSCRIPTION_TIERS } from '../utils/subscriptionManager.js';

export function renderPaywall(reason = 'subscription_required') {
    const messages = {
        subscription_required: {
            title: '🔒 Subscription Required',
            message: 'You need an active subscription to access this feature.',
            cta: 'View Plans'
        },
        subscription_expired: {
            title: '⚠️ Subscription Expired',
            message: 'Your subscription has expired. Renew to continue accessing premium features.',
            cta: 'Renew Subscription'
        },
        upgrade_required: {
            title: '⭐ Upgrade Required',
            message: 'This feature is available in Premium and Pro plans.',
            cta: 'Upgrade Now'
        },
        limit_reached: {
            title: '📊 Limit Reached',
            message: 'You\'ve reached your plan\'s limit. Upgrade for unlimited access.',
            cta: 'View Upgrade Options'
        }
    };

    const content = messages[reason] || messages.subscription_required;

    return `
        <div class="paywall-container">
            <div class="paywall-content animate-fadeIn">
                <div class="paywall-icon">🔐</div>
                
                <h1 class="paywall-title">${content.title}</h1>
                <p class="paywall-message">${content.message}</p>
                
                <!-- Feature Highlights -->
                <div class="paywall-features">
                    <h3>What you'll get with a subscription:</h3>
                    <div class="paywall-features-grid">
                        <div class="paywall-feature">
                            <span class="feature-emoji">🗺️</span>
                            <p>Unlimited location tracking</p>
                        </div>
                        <div class="paywall-feature">
                            <span class="feature-emoji">🤖</span>
                            <p>AI-powered recommendations</p>
                        </div>
                        <div class="paywall-feature">
                            <span class="feature-emoji">🏆</span>
                            <p>Achievement system</p>
                        </div>
                        <div class="paywall-feature">
                            <span class="feature-emoji">📊</span>
                            <p>Advanced analytics</p>
                        </div>
                    </div>
                </div>
                
                <!-- Popular Plan Preview -->
                <div class="paywall-plan-preview">
                    <div class="plan-badge">Most Popular</div>
                    <h4>${PLAN_FEATURES[SUBSCRIPTION_TIERS.PREMIUM].name}</h4>
                    <div class="plan-price">
                        <span>$${PLAN_FEATURES[SUBSCRIPTION_TIERS.PREMIUM].price}</span>
                        <span class="interval">/month</span>
                    </div>
                    <ul class="plan-features-mini">
                        ${PLAN_FEATURES[SUBSCRIPTION_TIERS.PREMIUM].features.slice(0, 4).map(f => `
                            <li>✓ ${f}</li>
                        `).join('')}
                    </ul>
                </div>
                
                <!-- CTAs -->
                <div class="paywall-actions">
                    <button class="btn btn-primary btn-lg" onclick="window.navigateToRoute('/pricing')">
                        ${content.cta}
                    </button>
                    <button class="btn btn-ghost" onclick="window.navigateToRoute('/')">
                        Go Back
                    </button>
                </div>
                
                <p class="paywall-footer">
                    Already have a subscription? <a onclick="window.navigateToRoute('/login')">Sign in</a>
                </p>
            </div>
        </div>
    `;
}

// Usage tracking paywall for free tier
export function renderLimitPaywall(limitType, current, max) {
    return `
        <div class="limit-paywall">
            <div class="limit-paywall-content">
                <div class="limit-icon">📊</div>
                <h3>Free Tier Limit Reached</h3>
                <p>You've used <strong>${current} of ${max}</strong> ${limitType} this month.</p>
                
                <div class="upgrade-preview">
                    <p>Upgrade to <strong>Premium</strong> for unlimited access:</p>
                    <ul>
                        <li>✓ Unlimited locations</li>
                        <li>✓ AI Guide (100 requests/month)</li>
                        <li>✓ Full achievements</li>
                        <li>✓ Analytics & exports</li>
                    </ul>
                </div>
                
                <button class="btn btn-primary" onclick="window.navigateToRoute('/pricing')">
                    Upgrade Now - $19.99/month
                </button>
                <button class="btn btn-ghost btn-sm" onclick="this.closest('.limit-paywall').remove()">
                    Maybe Later
                </button>
            </div>
        </div>
    `;
}

// Inline upgrade prompt for features
export function renderUpgradePrompt(feature, requiredTier = SUBSCRIPTION_TIERS.PREMIUM) {
    const plan = PLAN_FEATURES[requiredTier];

    return `
        <div class="upgrade-prompt">
            <div class="upgrade-prompt-content">
                <span class="upgrade-icon">⭐</span>
                <p><strong>${feature}</strong> is available in ${plan.name} plan</p>
                <button class="btn btn-sm btn-primary" onclick="window.navigateToRoute('/pricing')">
                    Upgrade for $${plan.price}/mo
                </button>
            </div>
        </div>
    `;
}
