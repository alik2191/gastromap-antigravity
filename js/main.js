// Main application entry point
import { router } from './utils/router.js';
import { appState } from './utils/state.js';
import { mockLocations } from './data/mockData.js';
import { renderLandingPage } from './pages/Landing.js';
import { renderLoginPage } from './pages/Login.js';
import { renderDashboard } from './pages/Dashboard.js';
import { renderProfile } from './pages/Profile.js';
import { renderAdmin } from './pages/Admin.js';
import { renderPricingPage } from './pages/Pricing.js';
import { initPaymentModal } from './components/PaymentModal.js';
import { renderPaywall } from './components/Paywall.js';

// Initialize app
function init() {
    // Load mock data
    appState.setLocations(mockLocations);

    // Initialize payment modal
    initPaymentModal();

    // Register routes with protection
    router.register('/', renderLandingPage);
    router.register('/pricing', renderPricingPage);
    router.register('/login', renderLoginPage);
    router.register('/signup', () => renderLoginPage(true));

    // Protected routes - require subscription
    router.register('/dashboard', () => protectedRoute(renderDashboard));
    router.register('/profile', () => protectedRoute(renderProfile));
    router.register('/admin', () => protectedRoute(renderAdmin));

    // Check authentication and route accordingly
    const state = appState.getState();
    const currentPath = window.location.pathname;

    // Public routes don't need protection
    const publicRoutes = ['/', '/pricing', '/login', '/signup'];

    if (publicRoutes.includes(currentPath)) {
        router.navigate(currentPath, false);
    } else if (state.isAuthenticated) {
        router.navigate(currentPath, false);
    } else {
        // Not authenticated, redirect to landing
        router.navigate('/', true);
    }
}

// Route protection middleware
function protectedRoute(renderFunc) {
    const state = appState.getState();

    // Check if user is authenticated
    if (!state.isAuthenticated) {
        router.navigate('/login');
        return;
    }

    // Check if user has active subscription (not just free tier)
    const hasPaidSub = state.subscription &&
        state.subscription.tier !== 'free' &&
        state.subscription.status === 'active';

    if (!hasPaidSub) {
        // Show paywall instead of content
        const app = document.getElementById('app');
        app.innerHTML = renderPaywall('subscription_required');
        return;
    }

    // User has paid subscription, render the page
    renderFunc();
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
