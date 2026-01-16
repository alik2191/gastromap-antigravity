// Subscription Manager - handles all subscription logic
export const SUBSCRIPTION_TIERS = {
    FREE: 'free',
    BASIC: 'basic',
    PREMIUM: 'premium',
    PRO: 'pro'
};

export const SUBSCRIPTION_STATUS = {
    ACTIVE: 'active',
    CANCELLED: 'cancelled',
    EXPIRED: 'expired',
    TRIAL: 'trial'
};

// Plan features and limits
export const PLAN_FEATURES = {
    [SUBSCRIPTION_TIERS.FREE]: {
        name: 'Free',
        price: 0,
        interval: 'forever',
        limits: {
            locations: 5,
            aiRequests: 0,
            exports: 0
        },
        features: [
            '5 locations per month',
            'Basic map view',
            'Manual tracking',
            'Community support'
        ],
        locked: [
            'AI Guide',
            'Advanced filters',
            'Achievements',
            'Analytics',
            'Export data'
        ]
    },
    [SUBSCRIPTION_TIERS.BASIC]: {
        name: 'Basic',
        price: 9.99,
        interval: 'month',
        limits: {
            locations: 50,
            aiRequests: 10,
            exports: 5
        },
        features: [
            '50 locations',
            'Full map with clusters',
            'Search & filters',
            'Wishlist',
            'Basic achievements',
            'Email support'
        ],
        locked: [
            'AI Guide',
            'Advanced analytics',
            'API access'
        ]
    },
    [SUBSCRIPTION_TIERS.PREMIUM]: {
        name: 'Premium',
        price: 19.99,
        interval: 'month',
        popular: true,
        limits: {
            locations: Infinity,
            aiRequests: 100,
            exports: Infinity
        },
        features: [
            'Unlimited locations',
            'AI-powered recommendations',
            'Full achievement system',
            'Advanced analytics',
            'Export data (CSV, JSON)',
            'Priority support',
            'No ads'
        ],
        locked: [
            'API access',
            'Team features'
        ]
    },
    [SUBSCRIPTION_TIERS.PRO]: {
        name: 'Pro',
        price: 49.99,
        interval: 'month',
        limits: {
            locations: Infinity,
            aiRequests: Infinity,
            exports: Infinity,
            teamMembers: 5
        },
        features: [
            'Everything in Premium',
            'API access with 10k requests/month',
            'Custom integrations',
            'White-label option',
            'Team features (up to 5 users)',
            'Dedicated account manager',
            'Custom reporting'
        ],
        locked: []
    }
};

class SubscriptionManager {
    constructor() {
        this.subscriptions = new Map();
        this.loadSubscriptions();
    }

    // Load subscriptions from localStorage
    loadSubscriptions() {
        try {
            const saved = localStorage.getItem('gastromap_subscriptions');
            if (saved) {
                const data = JSON.parse(saved);
                this.subscriptions = new Map(Object.entries(data));
            }
        } catch (e) {
            console.error('Failed to load subscriptions:', e);
        }
    }

    // Save subscriptions to localStorage
    saveSubscriptions() {
        try {
            const data = Object.fromEntries(this.subscriptions);
            localStorage.setItem('gastromap_subscriptions', JSON.stringify(data));
        } catch (e) {
            console.error('Failed to save subscriptions:', e);
        }
    }

    // Get user's subscription
    getSubscription(userId) {
        const sub = this.subscriptions.get(userId);
        if (!sub) {
            return this.createFreeSubscription(userId);
        }

        // Check if expired
        if (sub.status === SUBSCRIPTION_STATUS.ACTIVE && new Date(sub.expiresAt) < new Date()) {
            sub.status = SUBSCRIPTION_STATUS.EXPIRED;
            this.subscriptions.set(userId, sub);
            this.saveSubscriptions();
        }

        return sub;
    }

    // Create free subscription for new users
    createFreeSubscription(userId) {
        const subscription = {
            userId,
            tier: SUBSCRIPTION_TIERS.FREE,
            status: SUBSCRIPTION_STATUS.ACTIVE,
            startedAt: new Date().toISOString(),
            expiresAt: null, // Free never expires
            features: PLAN_FEATURES[SUBSCRIPTION_TIERS.FREE].features,
            limits: PLAN_FEATURES[SUBSCRIPTION_TIERS.FREE].limits,
            usage: {
                locations: 0,
                aiRequests: 0,
                exports: 0
            }
        };

        this.subscriptions.set(userId, subscription);
        this.saveSubscriptions();
        return subscription;
    }

    // Check if user has active subscription
    hasActiveSubscription(userId) {
        const sub = this.getSubscription(userId);
        return sub.status === SUBSCRIPTION_STATUS.ACTIVE || sub.status === SUBSCRIPTION_STATUS.TRIAL;
    }

    // Check if user has paid subscription
    hasPaidSubscription(userId) {
        const sub = this.getSubscription(userId);
        return sub.tier !== SUBSCRIPTION_TIERS.FREE && this.hasActiveSubscription(userId);
    }

    // Purchase/upgrade subscription
    purchaseSubscription(userId, tier, paymentInfo = {}) {
        const now = new Date();
        const expiresAt = new Date(now);
        expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 month subscription

        const subscription = {
            userId,
            tier,
            status: SUBSCRIPTION_STATUS.ACTIVE,
            startedAt: now.toISOString(),
            expiresAt: expiresAt.toISOString(),
            features: PLAN_FEATURES[tier].features,
            limits: PLAN_FEATURES[tier].limits,
            usage: {
                locations: 0,
                aiRequests: 0,
                exports: 0
            },
            paymentInfo: {
                lastPayment: now.toISOString(),
                amount: PLAN_FEATURES[tier].price,
                method: paymentInfo.method || 'card',
                nextBilling: expiresAt.toISOString()
            }
        };

        this.subscriptions.set(userId, subscription);
        this.saveSubscriptions();

        return subscription;
    }

    // Cancel subscription
    cancelSubscription(userId) {
        const sub = this.getSubscription(userId);
        if (sub) {
            sub.status = SUBSCRIPTION_STATUS.CANCELLED;
            this.subscriptions.set(userId, sub);
            this.saveSubscriptions();
        }
        return sub;
    }

    // Check if feature is available for user
    isFeatureAvailable(userId, feature) {
        const sub = this.getSubscription(userId);
        const plan = PLAN_FEATURES[sub.tier];

        // Check if feature is in locked list
        if (plan.locked.some(locked => locked.toLowerCase().includes(feature.toLowerCase()))) {
            return false;
        }

        return true;
    }

    // Check if user can perform action (within limits)
    canPerformAction(userId, action) {
        const sub = this.getSubscription(userId);

        if (!sub || !sub.limits) return false;

        const usage = sub.usage || {};
        const limits = sub.limits;

        switch (action) {
            case 'view_location':
                return limits.locations === Infinity || usage.locations < limits.locations;
            case 'ai_request':
                return limits.aiRequests === Infinity || usage.aiRequests < limits.aiRequests;
            case 'export':
                return limits.exports === Infinity || usage.exports < limits.exports;
            default:
                return true;
        }
    }

    // Track usage
    trackUsage(userId, action) {
        const sub = this.getSubscription(userId);
        if (!sub.usage) sub.usage = {};

        switch (action) {
            case 'view_location':
                sub.usage.locations = (sub.usage.locations || 0) + 1;
                break;
            case 'ai_request':
                sub.usage.aiRequests = (sub.usage.aiRequests || 0) + 1;
                break;
            case 'export':
                sub.usage.exports = (sub.usage.exports || 0) + 1;
                break;
        }

        this.subscriptions.set(userId, sub);
        this.saveSubscriptions();
    }

    // Get remaining quota
    getRemainingQuota(userId, action) {
        const sub = this.getSubscription(userId);
        const usage = sub.usage || {};
        const limits = sub.limits;

        if (limits[action] === Infinity) return Infinity;

        const actionMap = {
            'view_location': 'locations',
            'ai_request': 'aiRequests',
            'export': 'exports'
        };

        const key = actionMap[action];
        return Math.max(0, limits[key] - (usage[key] || 0));
    }

    // Get all plan features for comparison
    getAllPlans() {
        return PLAN_FEATURES;
    }

    // Get subscription tier name
    getTierName(tier) {
        return PLAN_FEATURES[tier]?.name || 'Free';
    }
}

export const subscriptionManager = new SubscriptionManager();
