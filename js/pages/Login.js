// Login/Signup Page
import { router } from '../utils/router.js';
import { appState } from '../utils/state.js';

export function renderLoginPage(isSignup = false) {
    const app = document.getElementById('app');

    app.innerHTML = `
        <div class="login-page">
            <div class="login-background"></div>
            
            <div class="login-container">
                <div class="login-logo">
                    <h1>GastroMap</h1>
                    <p>${isSignup ? 'Create your account' : 'Welcome back'}</p>
                </div>
                
                <form id="authForm" class="animate-scaleIn">
                    ${isSignup ? `
                        <div class="form-group">
                            <label class="form-label">Full Name</label>
                            <input type="text" 
                                   class="form-input" 
                                   id="name"
                                   placeholder="John Doe"
                                   required>
                        </div>
                    ` : ''}
                    
                    <div class="form-group">
                        <label class="form-label">Email</label>
                        <input type="email" 
                               class="form-input" 
                               id="email"
                               placeholder="you@example.com"
                               required>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Password</label>
                        <input type="password" 
                               class="form-input" 
                               id="password"
                               placeholder="••••••••"
                               required>
                    </div>
                    
                    ${!isSignup ? `
                        <div class="form-group" style="display: flex; align-items: center; gap: var(--space-2);">
                            <input type="checkbox" id="remember" style="width: auto;">
                            <label for="remember" style="margin: 0; font-size: var(--font-size-sm);">
                                Remember me
                            </label>
                        </div>
                    ` : ''}
                    
                    <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: var(--space-4);">
                        ${isSignup ? 'Create Account' : 'Sign In'}
                    </button>
                </form>
                
                <div class="login-divider">or</div>
                
                <button class="btn btn-outline" style="width: 100%;" onclick="window.demoLogin()">
                    <span style="margin-right: var(--space-2);">👤</span>
                    ${isSignup ? 'Try Demo Account' : 'Continue as Demo User'}
                </button>
                
                <div class="login-footer">
                    ${isSignup ?
            `Already have an account? <a onclick="window.navigateToRoute('/login')">Sign in</a>` :
            `Don't have an account? <a onclick="window.navigateToRoute('/signup')">Sign up</a>`
        }
                </div>
            </div>
        </div>
    `;

    // Handle form submission
    const form = document.getElementById('authForm');
    form.addEventListener('submit', handleAuth);

    // Demo login function - give demo user a premium subscription
    window.demoLogin = () => {
        const user = {
            id: 'demo@gastromap.app',
            name: 'Demo User',
            email: 'demo@gastromap.app',
            role: 'admin'
        };

        appState.login(user);

        // Give demo user premium subscription
        import('../utils/subscriptionManager.js').then(({ subscriptionManager, SUBSCRIPTION_TIERS }) => {
            const subscription = subscriptionManager.purchaseSubscription(
                user.id,
                SUBSCRIPTION_TIERS.PREMIUM
            );
            appState.updateSubscription(subscription);
            router.navigate('/dashboard');
        });
    };
}

function handleAuth(e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const nameInput = document.getElementById('name');
    const name = nameInput ? nameInput.value : email.split('@')[0];

    // Simple validation (in real app, this would call an API)
    if (email && password) {
        // Determine role (admin if email contains 'admin')
        const role = email.includes('admin') ? 'admin' : 'user';

        const user = {
            id: email,
            name,
            email,
            role
        };

        appState.login(user);

        // Check subscription status
        const state = appState.getState();
        const hasPaidSub = state.subscription &&
            state.subscription.tier !== 'free' &&
            state.subscription.status === 'active';

        // Check if user selected a plan before signup
        const selectedPlan = sessionStorage.getItem('selectedPlan');

        if (!hasPaidSub && !selectedPlan) {
            // No paid subscription, redirect to pricing
            router.navigate('/pricing');
        } else if (selectedPlan) {
            // User selected a plan, show payment modal
            sessionStorage.removeItem('selectedPlan');
            router.navigate('/pricing');
            setTimeout(() => {
                const event = new CustomEvent('showPayment', {
                    detail: { tier: selectedPlan }
                });
                window.dispatchEvent(event);
            }, 500);
        } else {
            // Has paid subscription, go to dashboard
            router.navigate('/dashboard');
        }
    }
}
