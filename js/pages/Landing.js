// Landing Page
import { router } from '../utils/router.js';
import { renderNavbar } from '../components/Navbar.js';

export function renderLandingPage() {
    const app = document.getElementById('app');

    app.innerHTML = `
        ${renderNavbar()}
        
        <div class="landing-page">
            <!-- Hero Section -->
            <section class="hero">
                <div class="hero-background"></div>
                
                <div class="hero-content">
                    <h1 class="hero-title animate-fadeIn">
                        Explore Flavors<br/>Without Borders
                    </h1>
                    <p class="hero-subtitle animate-fadeIn">
                        Discover, track, and share your culinary adventures around the world.
                        From hidden local gems to Michelin-starred restaurants.
                    </p>
                    <div class="hero-actions animate-fadeIn">
                        <button class="btn btn-secondary btn-lg" onclick="window.navigateToSignup()">
                            Get Started Free
                        </button>
                        <button class="btn btn-outline btn-lg" style="color: white; border-color: white;" onclick="window.navigateToLogin()">
                            Sign In
                        </button>
                    </div>
                    
                    <div class="hero-image animate-fadeIn">
                        <img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=800&fit=crop" 
                             alt="Beautiful restaurant interior" 
                             style="border-radius: 24px;">
                    </div>
                </div>
            </section>
            
            <!-- Features Section -->
            <section class="features-section">
                <div class="container">
                    <h2 class="section-title">Why Choose GastroMap?</h2>
                    <p class="section-subtitle">
                        Everything you need to discover and track your culinary journey
                    </p>
                    
                    <div class="features-grid">
                        <div class="feature-card">
                            <div class="feature-icon">🗺️</div>
                            <h3 class="feature-title">Interactive Map</h3>
                            <p class="feature-description">
                                Explore restaurants, cafes, and food spots on an interactive map with smart clustering and filters.
                            </p>
                        </div>
                        
                        <div class="feature-card">
                            <div class="feature-icon">🤖</div>
                            <h3 class="feature-title">AI Guide</h3>
                            <p class="feature-description">
                                Get personalized recommendations based on your preferences, dietary needs, and location.
                            </p>
                        </div>
                        
                        <div class="feature-card">
                            <div class="feature-icon">🏆</div>
                            <h3 class="feature-title">Achievements</h3>
                            <p class="feature-description">
                                Unlock badges and achievements as you explore new cuisines and expand your culinary horizons.
                            </p>
                        </div>
                        
                        <div class="feature-card">
                            <div class="feature-icon">❤️</div>
                            <h3 class="feature-title">Wishlist</h3>
                            <p class="feature-description">
                                Save your favorite spots and create custom lists for different occasions and moods.
                            </p>
                        </div>
                        
                        <div class="feature-card">
                            <div class="feature-icon">📊</div>
                            <h3 class="feature-title">Track Progress</h3>
                            <p class="feature-description">
                                Monitor your culinary journey with detailed statistics and visit history.
                            </p>
                        </div>
                        
                        <div class="feature-card">
                            <div class="feature-icon">🌍</div>
                            <h3 class="feature-title">Global Coverage</h3>
                            <p class="feature-description">
                                Access curated locations from major cities around the world, constantly updated.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
            
            <!-- CTA Section -->
            <section class="py-20" style="background: var(--gradient-primary);">
                <div class="container" style="text-align: center;">
                    <h2 style="font-size: var(--font-size-4xl); font-weight: var(--font-weight-extrabold); color: white; margin-bottom: var(--space-4);">
                        Ready to Start Your Culinary Journey?
                    </h2>
                    <p style="font-size: var(--font-size-xl); color: rgba(255,255,255,0.9); margin-bottom: var(--space-8);">
                        Join thousands of food lovers discovering amazing dining experiences
                    </p>
                    <button class="btn btn-secondary btn-lg" onclick="window.navigateToSignup()">
                        Create Free Account
                    </button>
                </div>
            </section>
        </div>
    `;

    // Add navigation functions to window object
    window.navigateToLogin = () => router.navigate('/login');
    window.navigateToSignup = () => router.navigate('/signup');

    // Add scroll effect to navbar
    addScrollEffect();
}

function addScrollEffect() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}
