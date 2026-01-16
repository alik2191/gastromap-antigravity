// Navbar Component
import { router } from '../utils/router.js';
import { appState } from '../utils/state.js';

export function renderNavbar() {
    const state = appState.getState();
    const { isAuthenticated, user } = state;

    if (!isAuthenticated) {
        return `
            <nav class="navbar">
                <div class="container">
                    <div class="navbar-content">
                        <a class="navbar-logo" onclick="window.navigateToRoute('/')">
                            GastroMap
                        </a>
                        
                        <ul class="navbar-menu">
                            <li><a href="#features" class="navbar-link">Features</a></li>
                            <li><a href="#" class="navbar-link">About</a></li>
                        </ul>
                        
                        <div class="navbar-actions">
                            <button class="btn btn-ghost btn-sm" onclick="window.navigateToRoute('/login')">
                                Sign In
                            </button>
                            <button class="btn btn-primary btn-sm" onclick="window.navigateToRoute('/signup')">
                                Get Started
                            </button>
                        </div>
                        
                        <button class="menu-toggle">
                            <span></span>
                            <span></span>
                            <span></span>
                        </button>
                    </div>
                </div>
            </nav>
        `;
    }

    // Authenticated navbar
    const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';
    const currentPath = router.getCurrent();

    return `
        <nav class="navbar scrolled">
            <div class="container">
                <div class="navbar-content">
                    <a class="navbar-logo" onclick="window.navigateToRoute('/dashboard')">
                        GastroMap
                    </a>
                    
                    <ul class="navbar-menu">
                        <li>
                            <a onclick="window.navigateToRoute('/dashboard')" 
                               class="navbar-link ${currentPath === '/dashboard' ? 'active' : ''}">
                                Dashboard
                            </a>
                        </li>
                        <li>
                            <a onclick="window.navigateToRoute('/profile')" 
                               class="navbar-link ${currentPath === '/profile' ? 'active' : ''}">
                                Profile
                            </a>
                        </li>
                        ${user?.role === 'admin' ? `
                            <li>
                                <a onclick="window.navigateToRoute('/admin')" 
                                   class="navbar-link ${currentPath === '/admin' ? 'active' : ''}">
                                    Admin
                                </a>
                            </li>
                        ` : ''}
                    </ul>
                    
                    <div class="navbar-actions">
                        <button class="btn btn-icon" onclick="window.toggleAIGuide()" title="AI Guide">
                            <span style="font-size: 20px;">🤖</span>
                        </button>
                        <div class="navbar-avatar" title="${user?.name || 'User'}" onclick="window.handleLogout()">
                            ${initial}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    `;
}

// Add global navigation function
if (typeof window !== 'undefined') {
    window.navigateToRoute = (path) => {
        router.navigate(path);
    };

    window.toggleAIGuide = () => {
        appState.toggleAIGuide();
        // Trigger AI Guide component update
        const event = new CustomEvent('aiGuideToggle');
        window.dispatchEvent(event);
    };

    window.handleLogout = () => {
        if (confirm('Are you sure you want to sign out?')) {
            appState.logout();
            router.navigate('/');
        }
    };
}
